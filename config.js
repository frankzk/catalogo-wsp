/*
 * PLANTILLA de configuración por tienda.
 * Para una tienda nueva: copia este archivo a /<tienda>/config.js y completa los valores.
 * (El token de Storefront es PÚBLICO y de solo lectura: seguro en el navegador.
 *  NUNCA pongas aquí el token de Admin API.)
 */
window.CATALOG_CONFIG = {
  // Marca
  storeName: "Mi Tienda",
  headline: "Mi Tienda",
  subtitle: "Envío gratis 🚚",

  // País (se usa en el mensaje: "Envío gratis a todo <país>").
  country: "Mi País",

  // Idioma/formato (es-CR = colones ₡; es-PE = soles, etc.)
  locale: "es-CR",

  // Número de WhatsApp que recibe los pedidos (solo dígitos, con código de país).
  whatsappNumber: "506XXXXXXXX",

  // Descuento global (%). Se muestra precio original tachado + rebajado, redondeado a entero.
  discountPercent: 30,

  // Checkout: "whatsapp" (envía pedido por WhatsApp) o "cod" (sube el pedido a Shopify
  // como contra entrega vía el Apps Script). Usa "cod" SOLO cuando el token de Admin
  // de esa tienda ya esté puesto en el Apps Script.
  checkoutMode: "whatsapp",

  // Sellos de confianza (se muestran en el detalle y en una tira).
  trustBadges: [
    { icon: "💵", title: "Pago contra entrega", sub: "Pagas al recibir" },
    { icon: "🚚", title: "Envío gratis", sub: "A todo el país" },
    { icon: "🛡️", title: "Garantía de calidad", sub: "Producto garantizado" },
    { icon: "↩️", title: "Devolución fácil", sub: "Compra sin riesgo" },
  ],

  // Métricas (Hoja de Google vía Apps Script). Puede ser una hoja por tienda o una compartida.
  metricsUrl: "",

  // Conexión en vivo con Shopify (Storefront API pública).
  shopifyDomain: "", // ej: "mi-tienda.myshopify.com"
  storefrontToken: "", // token público de Storefront (app Headless o app personalizado)
  shopifyApiVersion: "2025-10",

  // Mensaje inicial del pedido por WhatsApp.
  orderGreeting: "¡Hola! 👋 Quiero agregar estos productos a mi pedido:",
};
