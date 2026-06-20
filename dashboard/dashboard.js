/* ===== Revenue Lift del Catálogo · dashboard ===== */
(function () {
  "use strict";

  // Endpoint compartido (mismo Apps Script que metricsUrl en todas las tiendas)
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbyhRH_3rhNDuekJkBVsoQkwSfZTMIgr_JPt28dUpUrqFy5JHrO9sa2rV28NK_936eY79g/exec";

  // Tiendas (storeName tal como se registra en la hoja) + locale para formato
  const STORES = [
    { name: "Mireva Costa Rica", locale: "es-CR" },
    { name: "Mireva Honduras", locale: "es-HN" },
    { name: "Kenku Argentina", locale: "es-AR" },
    { name: "Kenku España", locale: "es-ES" },
    { name: "Kenku Italia", locale: "it-IT" },
    { name: "Kenku México", locale: "es-MX" },
    { name: "Kenku Panamá", locale: "es-PA" },
    { name: "Kenku Perú", locale: "es-PE" },
  ];

  const KEY_LS = "dash:key";
  const $ = (id) => document.getElementById(id);
  let currency = "USD";
  let locale = "es-CR";

  /* ---------- Formato ---------- */
  function money(n) {
    n = Number(n) || 0;
    try { return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n); }
    catch (e) { return Math.round(n).toLocaleString() + " " + currency; }
  }
  function num(n) { return (Number(n) || 0).toLocaleString(locale); }
  function pct(n) { return (Number(n) || 0).toFixed(1) + "%"; }

  /* ---------- Fechas ---------- */
  function iso(d) { return d.toISOString().slice(0, 10); }
  function applyPreset() {
    const p = $("fPreset").value;
    if (p === "custom") return;
    const to = new Date();
    const from = new Date(); from.setDate(from.getDate() - (Number(p) - 1));
    $("fFrom").value = iso(from);
    $("fTo").value = iso(to);
  }

  /* ---------- Gate ---------- */
  function showGate(err) {
    $("gate").hidden = false; $("app").hidden = true;
    $("gateError").hidden = !err;
  }
  function showApp() { $("gate").hidden = true; $("app").hidden = false; }

  function init() {
    // Poblar tiendas
    const sel = $("fStore");
    STORES.forEach((s) => { const o = document.createElement("option"); o.value = s.name; o.textContent = s.name; sel.appendChild(o); });
    // Fechas por defecto (últimos 30 días)
    applyPreset();

    $("fPreset").addEventListener("change", () => { if ($("fPreset").value !== "custom") applyPreset(); });
    ["fFrom", "fTo"].forEach((id) => $(id).addEventListener("change", () => { $("fPreset").value = "custom"; }));
    $("applyBtn").addEventListener("click", load);
    $("fStore").addEventListener("change", load);
    $("logoutBtn").addEventListener("click", () => { localStorage.removeItem(KEY_LS); showGate(false); });

    // Tabs
    document.querySelectorAll(".dash-tab").forEach((t) => t.addEventListener("click", () => {
      document.querySelectorAll(".dash-tab").forEach((x) => x.classList.toggle("is-active", x === t));
      document.querySelectorAll(".dash-tabpanel").forEach((p) => { p.hidden = p.getAttribute("data-panel") !== t.getAttribute("data-tab"); });
    }));

    // Gate
    $("gateForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const k = $("gateKey").value.trim();
      if (!k) return;
      localStorage.setItem(KEY_LS, k);
      showApp(); load();
    });

    const saved = localStorage.getItem(KEY_LS);
    if (saved) { showApp(); load(); } else { showGate(false); }
  }

  /* ---------- Carga ---------- */
  async function load() {
    const key = localStorage.getItem(KEY_LS) || "";
    if (!key) { showGate(false); return; }
    const store = $("fStore").value;
    locale = (STORES.find((s) => s.name === store) || {}).locale || "es-CR";

    $("loading").hidden = false; $("content").hidden = true; $("errorBox").hidden = true;
    const qs = new URLSearchParams({
      action: "report", key,
      store, from: $("fFrom").value, to: $("fTo").value,
      product: $("fProduct").value || "",
    });
    try {
      const res = await fetch(ENDPOINT + "?" + qs.toString());
      const j = await res.json();
      $("loading").hidden = true;
      if (!j || j.ok === false) {
        if (j && j.error === "auth") { localStorage.removeItem(KEY_LS); showGate(true); return; }
        return fail((j && j.error) || "No se pudo cargar.");
      }
      render(j);
    } catch (e) {
      $("loading").hidden = true;
      fail("Error de red al consultar el endpoint.");
    }
  }

  function fail(msg) { const b = $("errorBox"); b.textContent = msg; b.hidden = false; }

  /* ---------- Render ---------- */
  function render(j) {
    currency = j.currency || currency;
    $("content").hidden = false;
    $("dashSubtitle").textContent = "Tienda: " + ($("fStore").value) + " · " + j.range.from + " → " + j.range.to;

    // Hero
    $("heroAmount").textContent = money(j.hero.additional);
    $("heroPct").textContent = pct(j.hero.pctOfMain);
    $("heroDaily").textContent = money(j.hero.daily);

    // KPIs
    const k = j.kpis;
    const kpis = [
      { label: "Pedidos que recibieron catálogo", value: num(k.received) },
      { label: "Pedidos con upsell", value: num(k.withUpsell) },
      { label: "Tasa de upsell", value: pct(k.upsellRate) },
      { label: "Venta adicional total", value: money(k.additionalTotal) },
      { label: "Ticket adicional promedio", value: money(k.avgTicket) },
      { label: "Incremento del AOV", value: money(k.aovUplift), sub: "+" + pct(k.aovUpliftPct) + " vs " + money(k.aovBase) },
    ];
    $("kpis").innerHTML = kpis.map((x) =>
      '<div class="dash-kpi"><div class="k-label">' + x.label + '</div><div class="k-value">' + x.value + '</div>' +
      (x.sub ? '<div class="k-sub">' + x.sub + '</div>' : "") + "</div>"
    ).join("");

    // Embudo
    const f = j.funnel || [];
    const base = f.length ? Math.max(1, f[0].count) : 1;
    $("funnel").innerHTML = f.map((step, i) => {
      const prev = i === 0 ? null : f[i - 1].count;
      const conv = prev == null ? null : (prev > 0 ? step.count / prev * 100 : 0);
      const w = Math.max(4, Math.round(step.count / base * 100));
      return '<div class="dash-step"><div class="s-name">' + step.name + '</div>' +
        '<div class="s-count">' + num(step.count) + '</div>' +
        (conv === null ? '<div class="s-conv">&nbsp;</div>' : '<div class="s-conv">' + pct(conv) + ' del paso previo</div>') +
        '<div class="s-bar" style="width:' + w + '%"></div></div>';
    }).join("");
    $("funnelHint").textContent = "Confirmados (Shopify) → aperturas/agregados/compras (catálogo)";

    // Tablas
    renderTable($("tblCatalog"), j.topCatalog, (r) => [esc(r.title), num(r.units), money(r.sales), pct(r.share)]);
    renderTable($("tblOrigin"), j.topOrigin, (r) => [esc(r.title || "(desconocido)"), num(r.upsells), money(r.sales), pct(r.share)]);

    // Filtro de productos (preserva selección)
    const fp = $("fProduct"); const cur = fp.value;
    fp.innerHTML = '<option value="">Todos</option>' + (j.products || []).map((p) => '<option value="' + esc(p) + '">' + esc(p) + "</option>").join("");
    fp.value = cur;

    // Gráfica
    drawChart(j.daily || []);
  }

  function renderTable(table, rows, cols) {
    const tb = table.querySelector("tbody");
    if (!rows || !rows.length) { tb.innerHTML = '<tr><td colspan="4" class="dash-empty">Sin datos en el rango.</td></tr>'; return; }
    tb.innerHTML = rows.map((r) => {
      const c = cols(r);
      return "<tr><td>" + c[0] + '</td><td class="num">' + c[1] + '</td><td class="num">' + c[2] + '</td><td class="num">' + c[3] + "</td></tr>";
    }).join("");
  }

  /* ---------- Gráfica SVG ---------- */
  function drawChart(daily) {
    const host = $("chart");
    if (!daily.length) { host.innerHTML = '<div class="dash-empty">Sin ventas en el rango.</div>'; return; }
    const W = Math.max(640, daily.length * 26), H = 180, pad = 24, bw = Math.max(6, (W - pad * 2) / daily.length - 4);
    const max = Math.max(1, ...daily.map((d) => d.sales));
    const x = (i) => pad + i * ((W - pad * 2) / daily.length);
    const everyLbl = Math.ceil(daily.length / 12);
    let bars = "", labels = "";
    daily.forEach((d, i) => {
      const h = Math.round((d.sales / max) * (H - pad * 2));
      bars += '<rect class="bar" x="' + (x(i) + 2).toFixed(1) + '" y="' + (H - pad - h) + '" width="' + bw.toFixed(1) + '" height="' + h + '" rx="2"><title>' + d.date + ": " + money(d.sales) + "</title></rect>";
      if (i % everyLbl === 0) labels += '<text class="lbl" x="' + (x(i) + bw / 2 + 2).toFixed(1) + '" y="' + (H - pad + 12) + '" text-anchor="middle">' + d.date.slice(5) + "</text>";
    });
    host.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '">' +
      '<line class="axis" x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" />' +
      bars + labels + "</svg>";
  }

  /* ---------- Util ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  document.addEventListener("DOMContentLoaded", init);
})();
