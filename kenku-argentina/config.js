/* Configuración de Kenku Argentina. Completa los 3 campos marcados ⚠️ COMPLETAR. */
window.CATALOG_CONFIG = {
  storeName: "Kenku Argentina",
  headline: "Kenku Argentina",
  subtitle: "Envío gratis a todo Argentina 🚚",
  country: "Argentina",
  locale: "es-AR",

  whatsappNumber: "",            // ⚠️ COMPLETAR: número con código de país (solo dígitos)
  discountPercent: 30,

  trustBadges: [
    { icon: "💵", title: "Pago contra entrega", sub: "Pagas al recibir" },
    { icon: "🚚", title: "Envío gratis", sub: "A todo Argentina" },
    { icon: "🛡️", title: "Garantía de calidad", sub: "Producto garantizado" },
    { icon: "↩️", title: "Devolución fácil", sub: "Compra sin riesgo" },
  ],

  metricsUrl: "",                // (opcional) URL del Apps Script para métricas

  shopifyDomain: "",             // ⚠️ COMPLETAR: algo.myshopify.com
  storefrontToken: "",           // ⚠️ COMPLETAR: token público de Storefront
  shopifyApiVersion: "2025-10",

  orderGreeting: "¡Hola! 👋 Quiero agregar estos productos a mi pedido:",
};
