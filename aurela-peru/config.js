/* Configuración de Aurela Perú (WooCommerce). Completa wooUrl. */
window.CATALOG_CONFIG = {
  storeName: "Aurela Perú",
  headline: "Aurela Perú",
  subtitle: "Envío gratis a todo Perú 🚚",
  country: "Perú",
  locale: "es-PE",

  whatsappNumber: "51900183696",            // número con código de país (solo dígitos)
  discountPercent: 30,
  checkoutMode: "cod",           // contra entrega: crea el pedido en WooCommerce vía el Apps Script

  trustBadges: [
    { icon: "💵", title: "Pago contra entrega", sub: "Pagas al recibir" },
    { icon: "🚚", title: "Envío gratis", sub: "A todo Perú" },
    { icon: "🛡️", title: "Garantía de calidad", sub: "Producto garantizado" },
    { icon: "↩️", title: "Devolución fácil", sub: "Compra sin riesgo" },
  ],

  metricsUrl: "https://script.google.com/macros/s/AKfycbyhRH_3rhNDuekJkBVsoQkwSfZTMIgr_JPt28dUpUrqFy5JHrO9sa2rV28NK_936eY79g/exec",                // (opcional) URL del Apps Script para métricas

  // ---- Tienda WooCommerce (WordPress) ----
  // El catálogo lee los productos de la Store API pública de WooCommerce (sin token).
  // Los pedidos contra entrega los crea el Apps Script con las claves REST de Woo
  // (propiedad del script WOO_<dominio>), que NUNCA van en este archivo.
  platform: "woocommerce",
  wooUrl: "", // ⚠️ COMPLETAR: URL del WordPress, ej. "https://tutienda.pe"

  orderGreeting: "¡Hola! 👋 Quiero agregar estos productos a mi pedido:",
};
