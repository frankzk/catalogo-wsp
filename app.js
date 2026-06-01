/* Catálogo WhatsApp — lógica de cliente (sin backend).
 * Flujo: cargar productos (Shopify en vivo o data/products.json) → mostrar grilla
 * estilo WhatsApp Business → carrito con cantidades → enviar pedido por wa.me. */

(function () {
  "use strict";

  const CFG = window.CATALOG_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);

  // Estado en memoria.
  let PRODUCTS = []; // [{id, title, type, image, variants:[{id,title,price,available}]}]
  let CURRENCY = CFG.currency || "PEN";
  const cart = new Map(); // key: variantId -> {qty, product, variant}
  let activeCategory = "Todos";
  let query = "";

  /* ---------- Utilidades ---------- */
  const money = (n) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: 2,
    }).format(n || 0);

  const debounce = (fn, ms) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  function setStatus(msg, isError) {
    const el = $("#status");
    if (!msg) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = msg;
    el.classList.toggle("error", !!isError);
  }

  /* ---------- Carga de productos ---------- */
  async function loadProducts() {
    if (CFG.shopifyDomain && CFG.storefrontToken) {
      try {
        return await loadFromShopify();
      } catch (e) {
        console.warn("Storefront API falló, uso respaldo local:", e);
      }
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
          title productType
          featuredImage { url }
          variants(first: 25) { edges { node {
            id title availableForSale
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
          };
        });
        out.push({
          id: node.title,
          title: node.title,
          type: node.productType || "Otros",
          image: node.featuredImage ? node.featuredImage.url : "",
          variants,
        });
      }
      if (!conn.pageInfo.hasNextPage) break;
      cursor = conn.pageInfo.endCursor;
    }
    return out;
  }

  /* ---------- Render ---------- */
  function variantPrice(p, variantId) {
    const v = p.variants.find((x) => x.id === variantId) || p.variants[0];
    return v ? v.price : 0;
  }
  function minPrice(p) {
    return Math.min(...p.variants.map((v) => v.price));
  }

  function buildCategories() {
    const cats = ["Todos", ...new Set(PRODUCTS.map((p) => p.type).filter(Boolean))];
    const wrap = $("#categoryChips");
    wrap.innerHTML = "";
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip" + (c === activeCategory ? " active" : "");
      b.textContent = c;
      b.onclick = () => {
        activeCategory = c;
        buildCategories();
        renderGrid();
      };
      wrap.appendChild(b);
    });
  }

  function filtered() {
    const ql = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (activeCategory !== "Todos" && p.type !== activeCategory) return false;
      if (ql && !p.title.toLowerCase().includes(ql)) return false;
      return true;
    });
  }

  function renderGrid() {
    const grid = $("#grid");
    const list = filtered();
    grid.innerHTML = "";
    if (!list.length) {
      setStatus("No se encontraron productos.");
      return;
    }
    setStatus(null);
    const frag = document.createDocumentFragment();
    list.forEach((p) => frag.appendChild(card(p)));
    grid.appendChild(frag);
  }

  function card(p) {
    const el = document.createElement("article");
    el.className = "card";
    const hasVariants = p.variants.length > 1;
    const anyAvailable = p.variants.some((v) => v.available);

    el.innerHTML = `
      <img class="card-img" loading="lazy" src="${p.image}" alt="${escapeAttr(p.title)}"
           onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f0f2f4%22/></svg>'" />
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(p.title)}</h3>
        <div class="card-price">${money(minPrice(p))}</div>
        ${
          hasVariants
            ? `<select class="variant-select">${p.variants
                .map(
                  (v) =>
                    `<option value="${v.id}" ${v.available ? "" : "disabled"}>${escapeHtml(
                      v.title
                    )} — ${money(v.price)}${v.available ? "" : " (agotado)"}</option>`
                )
                .join("")}</select>`
            : ""
        }
        <div class="card-foot"></div>
      </div>`;

    const select = el.querySelector(".variant-select");
    const foot = el.querySelector(".card-foot");

    const currentVariantId = () =>
      select ? select.value : p.variants[0].id;

    function renderFoot() {
      const vid = currentVariantId();
      const inCart = cart.get(vid);
      if (!anyAvailable) {
        foot.innerHTML = `<button class="add-btn sold-out" disabled>Agotado</button>`;
        return;
      }
      if (inCart) {
        foot.innerHTML = `
          <div class="stepper">
            <button data-act="dec" aria-label="Quitar uno">−</button>
            <span>${inCart.qty}</span>
            <button data-act="inc" aria-label="Agregar uno">+</button>
          </div>`;
        foot.querySelector('[data-act="dec"]').onclick = () => {
          changeQty(p, vid, -1);
          renderFoot();
        };
        foot.querySelector('[data-act="inc"]').onclick = () => {
          changeQty(p, vid, +1);
          renderFoot();
        };
      } else {
        foot.innerHTML = `<button class="add-btn">Agregar</button>`;
        foot.querySelector(".add-btn").onclick = () => {
          changeQty(p, vid, +1);
          renderFoot();
        };
      }
    }

    if (select) select.onchange = renderFoot;
    renderFoot();
    return el;
  }

  /* ---------- Carrito ---------- */
  function changeQty(product, variantId, delta) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant || !variant.available) return;
    const entry = cart.get(variantId) || { qty: 0, product, variant };
    entry.qty += delta;
    if (entry.qty <= 0) cart.delete(variantId);
    else cart.set(variantId, entry);
    updateCartUI();
  }

  function cartTotals() {
    let count = 0;
    let total = 0;
    cart.forEach((e) => {
      count += e.qty;
      total += e.qty * e.variant.price;
    });
    return { count, total };
  }

  function updateCartUI() {
    const { count, total } = cartTotals();
    const bar = $("#cartBar");
    bar.hidden = count === 0;
    $("#cartBarCount").textContent = count;
    $("#cartBarTotal").textContent = money(total);
    if (!$("#sheet").hidden) renderCartItems();
  }

  function renderCartItems() {
    const wrap = $("#cartItems");
    $("#cartTotal").textContent = money(cartTotals().total);
    $("#sendBtn").disabled = cart.size === 0;
    if (cart.size === 0) {
      wrap.innerHTML = `<p class="cart-empty">Tu pedido está vacío.</p>`;
      return;
    }
    wrap.innerHTML = "";
    cart.forEach((e, vid) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      const variantLabel = e.variant.title !== "Default" ? e.variant.title : "";
      row.innerHTML = `
        <img src="${e.product.image}" alt="" />
        <div class="cart-row-info">
          <div class="cart-row-title">${escapeHtml(e.product.title)}</div>
          ${variantLabel ? `<div class="cart-row-variant">${escapeHtml(variantLabel)}</div>` : ""}
          <div class="cart-row-price">${money(e.variant.price)}</div>
        </div>
        <div class="stepper">
          <button data-act="dec" aria-label="Quitar uno">−</button>
          <span>${e.qty}</span>
          <button data-act="inc" aria-label="Agregar uno">+</button>
        </div>`;
      row.querySelector('[data-act="dec"]').onclick = () => {
        changeQty(e.product, vid, -1);
        renderGridFootFor(vid);
      };
      row.querySelector('[data-act="inc"]').onclick = () => {
        changeQty(e.product, vid, +1);
        renderGridFootFor(vid);
      };
      wrap.appendChild(row);
    });
  }

  // Mantiene en sincronía la grilla si el producto está visible.
  function renderGridFootFor() {
    renderGrid();
  }

  /* ---------- Envío por WhatsApp ---------- */
  function buildOrderMessage() {
    const lines = [];
    lines.push(CFG.orderGreeting || "¡Hola! Quiero hacer mi pedido:");
    lines.push("");
    cart.forEach((e) => {
      const variantLabel = e.variant.title !== "Default" ? ` (${e.variant.title})` : "";
      const lineTotal = e.qty * e.variant.price;
      lines.push(`• ${e.qty}x ${e.product.title}${variantLabel} — ${money(lineTotal)}`);
    });
    lines.push("");
    lines.push(`*Total: ${money(cartTotals().total)}*`);
    return lines.join("\n");
  }

  function sendOrder() {
    if (cart.size === 0) return;
    const number = String(CFG.whatsappNumber || "").replace(/\D/g, "");
    const text = encodeURIComponent(buildOrderMessage());
    const url = number
      ? `https://wa.me/${number}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  /* ---------- Sanitización ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  /* ---------- Hoja (sheet) ---------- */
  function openSheet() {
    $("#sheet").hidden = false;
    renderCartItems();
  }
  function closeSheet() {
    $("#sheet").hidden = true;
  }

  /* ---------- Inicialización ---------- */
  function wireUI() {
    if (CFG.storeName) {
      $("#storeName").textContent = CFG.storeName;
      $("#storeAvatar").textContent = CFG.storeName.trim().charAt(0).toUpperCase();
    }
    document.title = (CFG.storeName ? CFG.storeName + " — " : "") + "Catálogo";

    $("#search").addEventListener(
      "input",
      debounce((e) => {
        query = e.target.value;
        renderGrid();
      }, 180)
    );
    $("#cartBar").addEventListener("click", openSheet);
    $("#sendBtn").addEventListener("click", sendOrder);
    document.querySelectorAll("[data-close]").forEach((el) =>
      el.addEventListener("click", closeSheet)
    );
  }

  async function init() {
    wireUI();
    try {
      PRODUCTS = await loadProducts();
      if (!PRODUCTS.length) {
        setStatus("El catálogo está vacío por ahora.");
        return;
      }
      buildCategories();
      renderGrid();
    } catch (e) {
      console.error(e);
      setStatus("No se pudo cargar el catálogo. Revisa tu conexión o la configuración.", true);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
