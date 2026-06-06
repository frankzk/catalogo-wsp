/* Configuración de Kenku Argentina. Completa los 3 campos marcados ⚠️ COMPLETAR. */
window.CATALOG_CONFIG = {
  storeName: "Kenku Argentina",
  headline: "Kenku Argentina",
  subtitle: "Envío gratis a todo Argentina 🚚",
  country: "Argentina",
  locale: "es-AR",

  whatsappNumber: "51918100477",            // ⚠️ COMPLETAR: número con código de país (solo dígitos)
  discountPercent: 30,

  trustBadges: [
    { icon: "💵", title: "Pago contra entrega", sub: "Pagas al recibir" },
    { icon: "🚚", title: "Envío gratis", sub: "A todo Argentina" },
    { icon: "🛡️", title: "Garantía de calidad", sub: "Producto garantizado" },
    { icon: "↩️", title: "Devolución fácil", sub: "Compra sin riesgo" },
  ],

  metricsUrl: "https://script.google.com/macros/s/AKfycbyhRH_3rhNDuekJkBVsoQkwSfZTMIgr_JPt28dUpUrqFy5JHrO9sa2rV28NK_936eY79g/exec",                // (opcional) URL del Apps Script para métricas

  shopifyDomain: "rayytn-ia.myshopify.com",             // ⚠️ COMPLETAR: algo.myshopify.com
  storefrontToken: "bfe7e84ed48541ac7ba9c2d0f63136cb",           // ⚠️ COMPLETAR: token público de Storefront
  shopifyApiVersion: "2025-10",

  orderGreeting: "¡Hola! 👋 Quiero agregar estos productos a mi pedido:",
};
