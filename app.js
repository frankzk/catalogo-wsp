/* Catálogo WhatsApp — lógica de cliente (sin backend).
 * Flujo: cargar productos (Shopify en vivo o data/products.json) → grilla estilo
 * WhatsApp Business → detalle con carrusel + reseña → carrito con cantidades →
 * enviar pedido por wa.me. Aplica descuento global y muestra precio antes/después. */

(function () {
  "use strict";

  const CFG = window.CATALOG_CONFIG || {};
  const $ = (sel, root) => (root || document).querySelector(sel);
  const DISCOUNT = Math.max(0, Math.min(100, Number(CFG.discountPercent) || 0));

  // Estado en memoria.
  let PRODUCTS = []; // [{id,title,type,desc,images:[],variants:[{id,title,price,available,sku}]}]
  let CURRENCY = CFG.currency || "PEN";
  const cart = new Map(); // variantId -> {qty, product, variant}
  let activeCategory = "Todos";
  let query = "";

  /* ---------- Utilidades ---------- */
  const money = (n) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: 2,
    }).format(n || 0);

  // Precio con descuento aplicado.
  const final = (price) => Math.round(price * (1 - DISCOUNT / 100) * 100) / 100;

  const debounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  function setStatus(msg, isError) {
    const el = $("#status");
    if (!msg) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = msg;
    el.classList.toggle("error", !!isError);
  }

  /* ---------- Carga de productos ---------- */
  async function loadProducts() {
    if (CFG.shopifyDomain && CFG.storefrontToken) {
      try { return await loadFromShopify(); }
      catch (e) { console.warn("Storefront API falló, uso respaldo local:", e); }
    }
    return await loadFromFile();
  }

  async function loadFromFile() {
    const res = await fetch("data/products.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("No se pudo cargar data/products.json");
    const data = await res.json();
    if (data.currency) CURRENCY = data.currency;
    return data.products || [];
  }

  async function loadFromShopify() {
    const domain = CFG.shopifyDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const endpoint = `https://${domain}/api/2024-10/graphql.json`;
    const q = `query($cursor: String) {
      products(first: 100, after: $cursor, query: "available_for_sale:true") {
        pageInfo { hasNextPage endCursor }
        edges { node {
          title productType description
          images(first: 5) { edges { node { url } } }
          variants(first: 25) { edges { node {
            id title sku availableForSale
            price { amount currencyCode }
          } } }
        } }
      }
    }`;

    const out = [];
    let cursor = null;
    for (let page = 0; page < 20; page++) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": CFG.storefrontToken,
        },
        body: JSON.stringify({ query: q, variables: { cursor } }),
      });
      if (!res.ok) throw new Error("Shopify HTTP " + res.status);
      const json = await res.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));
      const conn = json.data.products;
      for (const { node } of conn.edges) {
        const variants = node.variants.edges.map(({ node: v }) => {
          if (v.price && v.price.currencyCode) CURRENCY = v.price.currencyCode;
          return {
            id: v.id,
            title: v.title === "Default Title" ? "Default" : v.title,
            price: parseFloat(v.price ? v.price.amount : 0),
            available: v.availableForSale,
            sku: v.sku || "",
          };
        });
        out.push({
          id: node.title,
          title: node.title,
          type: node.productType || "Otros",
          desc: shorten(stripHtml(node.description || ""), 220),
          images: node.images.edges.map((e) => e.node.url),
          variants,
        });
      }
      if (!conn.pageInfo.hasNextPage) break;
      cursor = conn.pageInfo.endCursor;
    }
    return out;
  }

  function stripHtml(s) { return String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
  function shorten(s, n) { return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; }

  /* ---------- Normalización: ocultar agotados ---------- */
  function visibleProducts(list) {
    return list
      .map((p) => {
        const variants = (p.variants || []).filter((v) => v.available && v.price > 0);
        return { ...p, variants, images: (p.images && p.images.length ? p.images : [p.image]).filter(Boolean) };
      })
      .filter((p) => p.variants.length > 0); // sin variantes disponibles → no se muestra
  }

  // Precio que paga el cliente y precio "antes" (tachado) para una variante.
  // - Producto normal: aplica el descuento global (old = precio original).
  // - Producto con noDiscount (ej. packs que ya son la oferta): usa price tal cual
  //   y muestra listPrice como tachado si existe.
  function priced(product, variant) {
    if (product && product.noDiscount) {
      const old = variant.listPrice && variant.listPrice > variant.price ? variant.listPrice : 0;
      return { pay: variant.price, old };
    }
    return { pay: final(variant.price), old: DISCOUNT > 0 ? variant.price : 0 };
  }

  // Variante más barata (por lo que paga el cliente) de un producto.
  const cheapestVariant = (p) =>
    p.variants.reduce((a, b) => (priced(p, b).pay < priced(p, a).pay ? b : a));

  /* ---------- Categorías ---------- */
  function buildCategories() {
    const cats = ["Todos", ...new Set(PRODUCTS.map((p) => p.type).filter(Boolean))];
    const wrap = $("#categoryChips");
    wrap.innerHTML = "";
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip" + (c === activeCategory ? " active" : "");
      b.textContent = c;
      b.onclick = () => { activeCategory = c; buildCategories(); renderGrid(); };
      wrap.appendChild(b);
    });
  }

  function filtered() {
    const ql = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (activeCategory !== "Todos" && p.type !== activeCategory) return false;
      if (ql && !(p.title + " " + (p.desc || "")).toLowerCase().includes(ql)) return false;
      return true;
    });
  }

  /* ---------- Bloque de precio (antes/después) ---------- */
  // Recibe {pay, old}: muestra el precio tachado solo si old > pay.
  function priceBlock(pr) {
    if (pr.old && pr.old > pr.pay) {
      return `<div class="price">
        <span class="price-old">${money(pr.old)}</span>
        <span class="price-now">${money(pr.pay)}</span>
      </div>`;
    }
    return `<div class="price"><span class="price-now">${money(pr.pay)}</span></div>`;
  }

  /* ---------- Grilla ---------- */
  function renderGrid() {
    const grid = $("#grid");
    const list = filtered();
    grid.innerHTML = "";
    if (!list.length) { setStatus("No se encontraron productos."); return; }
    setStatus(null);
    const frag = document.createDocumentFragment();
    list.forEach((p) => frag.appendChild(card(p)));
    grid.appendChild(frag);
  }

  function card(p) {
    const el = document.createElement("article");
    el.className = "card";
    el.innerHTML = `
      <img class="card-img" loading="lazy" src="${p.images[0] || ""}" alt="${escapeAttr(p.title)}"
           onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f0f2f4%22/></svg>'" />
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(p.title)}</h3>
        ${p.desc ? `<p class="card-desc">${escapeHtml(p.desc)}</p>` : ""}
        ${priceBlock(priced(p, cheapestVariant(p)))}
        <div class="card-foot"></div>
      </div>`;

    // Tocar imagen/título/desc abre el detalle.
    el.querySelector(".card-img").onclick = () => openDetail(p);
    el.querySelector(".card-title").onclick = () => openDetail(p);
    const d = el.querySelector(".card-desc");
    if (d) d.onclick = () => openDetail(p);

    renderFoot(el.querySelector(".card-foot"), p, p.variants[0].id);
    return el;
  }

  // Botón "Agregar" o stepper, para la variante por defecto del producto.
  function renderFoot(foot, p, variantId) {
    const inCart = cart.get(variantId);
    if (inCart) {
      foot.innerHTML = stepperHtml(inCart.qty);
      foot.querySelector('[data-act="dec"]').onclick = () => { changeQty(p, variantId, -1); };
      foot.querySelector('[data-act="inc"]').onclick = () => { changeQty(p, variantId, +1); };
    } else {
      foot.innerHTML = `<button class="add-btn">Agregar</button>`;
      foot.querySelector(".add-btn").onclick = () => {
        if (p.variants.length > 1) openDetail(p); // varias variantes → elegir en detalle
        else changeQty(p, variantId, +1);
      };
    }
  }

  const stepperHtml = (qty) => `
    <div class="stepper">
      <button data-act="dec" aria-label="Quitar uno">−</button>
      <span>${qty}</span>
      <button data-act="inc" aria-label="Agregar uno">+</button>
    </div>`;

  /* ---------- Detalle del producto (carrusel + reseña) ---------- */
  function openDetail(p) {
    let selVariant = p.variants[0].id;
    const panel = $("#detailPanel");
    const dots = p.images.length > 1
      ? `<div class="carousel-dots">${p.images.map((_, i) => `<span class="dot${i === 0 ? " active" : ""}"></span>`).join("")}</div>`
      : "";

    panel.innerHTML = `
      <div class="sheet-head">
        <h2>Detalle</h2>
        <button class="sheet-close" data-close aria-label="Cerrar">&times;</button>
      </div>
      <div class="detail-body">
        <div class="carousel" id="carousel">
          ${p.images.map((src) => `<img src="${src}" alt="${escapeAttr(p.title)}" />`).join("")}
        </div>
        ${dots}
        <h3 class="detail-title">${escapeHtml(p.title)}</h3>
        ${p.desc ? `<p class="detail-desc">${escapeHtml(p.desc)}</p>` : ""}
        <div id="detailPrice">${priceBlock(priced(p, p.variants[0]))}</div>
        ${CFG.shippingNote ? `<p class="ship-note">${escapeHtml(CFG.shippingNote)}</p>` : ""}
        ${
          p.variants.length > 1
            ? `<label class="detail-label">Elige una opción:</label>
               <select class="detail-variant">
                 ${p.variants.map((v) => `<option value="${v.id}">${escapeHtml(v.title)} — ${money(priced(p, v).pay)}</option>`).join("")}
               </select>`
            : ""
        }
      </div>
      <div class="sheet-foot">
        <div class="detail-foot" id="detailFoot"></div>
      </div>`;

    // Carrusel: actualizar puntitos al deslizar.
    const carousel = $("#carousel", panel);
    if (p.images.length > 1) {
      carousel.addEventListener("scroll", () => {
        const idx = Math.round(carousel.scrollLeft / carousel.clientWidth);
        panel.querySelectorAll(".dot").forEach((d, i) => d.classList.toggle("active", i === idx));
      });
    }

    const sel = panel.querySelector(".detail-variant");
    if (sel)
      sel.onchange = () => {
        selVariant = sel.value;
        const v = p.variants.find((x) => x.id === selVariant);
        $("#detailPrice", panel).innerHTML = priceBlock(priced(p, v));
        drawDetailFoot();
      };

    function drawDetailFoot() {
      const foot = $("#detailFoot", panel);
      const inCart = cart.get(selVariant);
      if (inCart) {
        foot.innerHTML = `<div class="detail-stepper">${stepperHtml(inCart.qty)}</div>
          <button class="send-btn" id="goCart">Ver pedido</button>`;
        foot.querySelector('[data-act="dec"]').onclick = () => { changeQty(p, selVariant, -1); drawDetailFoot(); };
        foot.querySelector('[data-act="inc"]').onclick = () => { changeQty(p, selVariant, +1); drawDetailFoot(); };
        foot.querySelector("#goCart").onclick = () => { closeDetail(); openSheet(); };
      } else {
        foot.innerHTML = `<button class="send-btn" id="addDetail">Agregar al pedido</button>`;
        foot.querySelector("#addDetail").onclick = () => { changeQty(p, selVariant, +1); drawDetailFoot(); };
      }
    }
    drawDetailFoot();

    $("#detail").hidden = false;
    panel.querySelectorAll("[data-close]").forEach((el) => (el.onclick = closeDetail));
    $("#detail .sheet-backdrop").onclick = closeDetail;
  }
  function closeDetail() { $("#detail").hidden = true; }

  /* ---------- Carrito ---------- */
  function changeQty(product, variantId, delta) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant || !variant.available) return;
    const entry = cart.get(variantId) || { qty: 0, product, variant };
    entry.qty += delta;
    if (entry.qty <= 0) cart.delete(variantId);
    else cart.set(variantId, entry);
    updateCartUI();
    renderGrid(); // refresca steppers visibles en la grilla
  }

  function cartTotals() {
    let count = 0, total = 0;
    cart.forEach((e) => { count += e.qty; total += e.qty * priced(e.product, e.variant).pay; });
    return { count, total };
  }

  function updateCartUI() {
    const { count, total } = cartTotals();
    $("#cartBar").hidden = count === 0;
    $("#cartBarCount").textContent = count;
    $("#cartBarTotal").textContent = money(total);
    if (!$("#sheet").hidden) renderCartItems();
  }

  function renderCartItems() {
    const wrap = $("#cartItems");
    $("#cartTotal").textContent = money(cartTotals().total);
    $("#sendBtn").disabled = cart.size === 0;
    if (cart.size === 0) { wrap.innerHTML = `<p class="cart-empty">Tu pedido está vacío.</p>`; return; }
    wrap.innerHTML = "";
    cart.forEach((e, vid) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      const variantLabel = e.variant.title !== "Default" ? e.variant.title : "";
      row.innerHTML = `
        <img src="${(e.product.images && e.product.images[0]) || ""}" alt="" />
        <div class="cart-row-info">
          <div class="cart-row-title">${escapeHtml(e.product.title)}</div>
          ${variantLabel ? `<div class="cart-row-variant">${escapeHtml(variantLabel)}</div>` : ""}
          <div class="cart-row-price">${money(priced(e.product, e.variant).pay)} c/u</div>
        </div>
        <div class="stepper">
          <button data-act="dec" aria-label="Quitar uno">−</button>
          <span>${e.qty}</span>
          <button data-act="inc" aria-label="Agregar uno">+</button>
        </div>`;
      row.querySelector('[data-act="dec"]').onclick = () => changeQty(e.product, vid, -1);
      row.querySelector('[data-act="inc"]').onclick = () => changeQty(e.product, vid, +1);
      wrap.appendChild(row);
    });
  }

  /* ---------- Envío por WhatsApp ---------- */
  function buildOrderMessage() {
    const lines = [];
    lines.push(CFG.orderGreeting || "¡Hola! Quiero hacer mi pedido:");
    lines.push("");
    cart.forEach((e) => {
      const variantLabel = e.variant.title !== "Default" ? ` (${e.variant.title})` : "";
      const sku = e.variant.sku ? ` [${e.variant.sku}]` : "";
      const lineTotal = e.qty * priced(e.product, e.variant).pay;
      lines.push(`• ${e.qty}x ${e.product.title}${variantLabel}${sku} — ${money(lineTotal)}`);
    });
    lines.push("");
    lines.push(`*Total: ${money(cartTotals().total)}*`);
    let anyDiscounted = false;
    cart.forEach((e) => { if (!(e.product && e.product.noDiscount)) anyDiscounted = true; });
    if (DISCOUNT > 0 && anyDiscounted) lines.push(`(Precios con ${DISCOUNT}% de descuento aplicado)`);
    if (CFG.shippingNote) lines.push(CFG.shippingNote);
    return lines.join("\n");
  }

  function sendOrder() {
    if (cart.size === 0) return;
    const number = String(CFG.whatsappNumber || "").replace(/\D/g, "");
    const text = encodeURIComponent(buildOrderMessage());
    const url = number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  /* ---------- Sanitización ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }

  /* ---------- Hoja del carrito ---------- */
  function openSheet() { $("#sheet").hidden = false; renderCartItems(); }
  function closeSheet() { $("#sheet").hidden = true; }

  /* ---------- Inicialización ---------- */
  function wireUI() {
    if (CFG.storeName) {
      $("#storeName").textContent = CFG.headline || CFG.storeName;
      $("#storeAvatar").textContent = CFG.storeName.trim().charAt(0).toUpperCase();
    }
    if (CFG.subtitle) $("#storeSub").textContent = CFG.subtitle;
    document.title = (CFG.storeName ? CFG.storeName + " — " : "") + (CFG.headline || "Catálogo");

    $("#search").addEventListener("input", debounce((e) => { query = e.target.value; renderGrid(); }, 180));
    $("#cartBar").addEventListener("click", openSheet);
    $("#sendBtn").addEventListener("click", sendOrder);
    $("#sheet").querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeSheet));
  }

  async function init() {
    wireUI();
    try {
      PRODUCTS = visibleProducts(await loadProducts());
      if (!PRODUCTS.length) { setStatus("El catálogo está vacío por ahora."); return; }
      buildCategories();
      renderGrid();
    } catch (e) {
      console.error(e);
      setStatus("No se pudo cargar el catálogo. Revisa tu conexión o la configuración.", true);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
