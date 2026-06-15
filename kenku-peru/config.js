/* Configuración de Kenku Perú. Completa los 3 campos marcados ⚠️ COMPLETAR. */
window.CATALOG_CONFIG = {
  storeName: "Kenku Perú",
  headline: "Kenku Perú",
  subtitle: "Envío gratis a todo Perú 🚚",
  country: "Perú",
  locale: "es-PE",

  whatsappNumber: "51900183696",            // ⚠️ COMPLETAR: número con código de país (solo dígitos)
  discountPercent: 30,
  checkoutMode: "cod",

  trustBadges: [
    { icon: "💵", title: "Pago contra entrega", sub: "Pagas al recibir" },
    { icon: "🚚", title: "Envío gratis", sub: "A todo Perú" },
    { icon: "🛡️", title: "Garantía de calidad", sub: "Producto garantizado" },
    { icon: "↩️", title: "Devolución fácil", sub: "Compra sin riesgo" },
  ],

  metricsUrl: "https://script.google.com/macros/s/AKfycbyhRH_3rhNDuekJkBVsoQkwSfZTMIgr_JPt28dUpUrqFy5JHrO9sa2rV28NK_936eY79g/exec",                // (opcional) URL del Apps Script para métricas

  shopifyDomain: "kenkuperu.myshopify.com",             // ⚠️ COMPLETAR: algo.myshopify.com
  storefrontToken: "c6d0875b1ff522976785b2476e772477",           // ⚠️ COMPLETAR: token público de Storefront
  shopifyApiVersion: "2025-10",

  orderGreeting: "¡Hola! 👋 Quiero agregar estos productos a mi pedido:",
};
