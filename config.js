/*
 * Configuración del catálogo. Edita estos valores y vuelve a publicar.
 * Este archivo se carga ANTES que app.js, así que define window.CATALOG_CONFIG.
 *
 * El token de Storefront es PÚBLICO por diseño (solo lectura del escaparate),
 * por eso es seguro dejarlo en el navegador. NO uses aquí el token de Admin API.
 */
window.CATALOG_CONFIG = {
  // Nombre de la tienda (aparece en la cabecera).
  storeName: "Mireva Costa Rica",

  // Título y subtítulo del catálogo.
  headline: "Mireva Costa Rica",
  subtitle: "Envío gratis a todo Costa Rica 🚚",

  // Idioma/formato de números (es-CR = colones tipo ₡19.900,00).
  locale: "es-CR",

  // Número de WhatsApp del negocio AL QUE llega el pedido.
  // Formato internacional, solo dígitos (sin +, espacios ni guiones).
  // Costa Rica = 506 + número. Ejemplo: 50688889999
  // ⚠️ REEMPLAZA este valor por tu número real.
  whatsappNumber: "51918100477",

  // Descuento global aplicado a los precios (en %). Se muestra precio original tachado + rebajado.
  discountPercent: 25,

  // Nota de envío que se incluye en el pedido de WhatsApp.
  shippingNote: "Envío gratis a todo Costa Rica 🎉",

  // Nota de pago contra entrega que se incluye en el pedido de WhatsApp.
  paymentNote: "Pago contra entrega: pagas al recibir 📦",

  // Sellos de confianza (se muestran en el detalle del producto y en una tira).
  // Edita libremente icono/título/subtítulo.
  trustBadges: [
    { icon: "💵", title: "Pago contra entrega", sub: "Pagas al recibir" },
    { icon: "🚚", title: "Envío gratis", sub: "A todo Costa Rica" },
    { icon: "🛡️", title: "Garantía de calidad", sub: "Producto garantizado" },
    { icon: "↩️", title: "Devolución fácil", sub: "Compra sin riesgo" },
  ],

  // ---- Conexión en vivo con Shopify (opcional pero recomendado) ----
  // Si completas estos dos campos, el catálogo se carga EN VIVO desde Shopify
  // (siempre actualizado). Si los dejas vacíos, se usa data/products.json.
  //
  // Cómo obtener el token (1 sola vez):
  //   Shopify Admin → Configuración → Apps y canales de venta →
  //   "Desarrollar apps" → Crear una app → Configurar Storefront API →
  //   marcar "unauthenticated_read_product_listings" (y _read_product_inventory)
  //   → Instalar → copiar el "Storefront API access token".
  shopifyDomain: "mireva-costa-rica.myshopify.com", // dominio .myshopify.com de la tienda
  storefrontToken: "40315a42f90090a40e3476d48864d777", // token PÚBLICO de Storefront API (solo lectura)
  shopifyApiVersion: "2025-10", // versión de la Storefront API

  // Mensaje inicial del pedido enviado por WhatsApp.
  orderGreeting: "¡Hola! 👋 Quiero confirmar mi pedido:",

  // ---- Métricas (opcional) ----
  // Pega aquí la URL del "Web App" de Google Apps Script para registrar
  // vistas, agregados al carrito, conversiones y pedidos en una Hoja de Google.
  // Si lo dejas vacío, no se registra nada (el catálogo funciona igual).
  metricsUrl: "https://script.google.com/macros/s/AKfycbyhRH_3rhNDuekJkBVsoQkwSfZTMIgr_JPt28dUpUrqFy5JHrO9sa2rV28NK_936eY79g/exec",
};
