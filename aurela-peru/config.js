/* Configuración de Aurela Perú. Completa los 3 campos marcados ⚠️ COMPLETAR. */
window.CATALOG_CONFIG = {
  storeName: "Aurela Perú",
  headline: "Aurela Perú",
  subtitle: "Envío gratis a todo Perú 🚚",
  country: "Perú",
  locale: "es-PE",

  whatsappNumber: "51900183696",            // número con código de país (solo dígitos)
  discountPercent: 30,
  checkoutMode: "cod",           // contra entrega: sube el pedido a Shopify vía el Apps Script

  trustBadges: [
    { icon: "💵", title: "Pago contra entrega", sub: "Pagas al recibir" },
    { icon: "🚚", title: "Envío gratis", sub: "A todo Perú" },
    { icon: "🛡️", title: "Garantía de calidad", sub: "Producto garantizado" },
    { icon: "↩️", title: "Devolución fácil", sub: "Compra sin riesgo" },
  ],

  metricsUrl: "https://script.google.com/macros/s/AKfycbyhRH_3rhNDuekJkBVsoQkwSfZTMIgr_JPt28dUpUrqFy5JHrO9sa2rV28NK_936eY79g/exec",                // (opcional) URL del Apps Script para métricas

  shopifyDomain: "aurela-peru.myshopify.com",             // dominio Shopify (algo.myshopify.com)
  storefrontToken: "",           // ⚠️ COMPLETAR: token público de Storefront
  shopifyApiVersion: "2025-10",

  orderGreeting: "¡Hola! 👋 Quiero agregar estos productos a mi pedido:",
};
