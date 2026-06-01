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

  // Descuento global aplicado a los precios (en %). 0 = sin descuento global.
  // Los packs con oferta propia usan "noDiscount": true en data/products.json.
  discountPercent: 0,

  // Nota de envío que se muestra y se incluye en el pedido.
  shippingNote: "Envío gratis a todo Costa Rica 🎉",

  // ---- Conexión en vivo con Shopify (opcional pero recomendado) ----
  // Si completas estos dos campos, el catálogo se carga EN VIVO desde Shopify
  // (siempre actualizado). Si los dejas vacíos, se usa data/products.json.
  //
  // Cómo obtener el token (1 sola vez):
  //   Shopify Admin → Configuración → Apps y canales de venta →
  //   "Desarrollar apps" → Crear una app → Configurar Storefront API →
  //   marcar "unauthenticated_read_product_listings" (y _read_product_inventory)
  //   → Instalar → copiar el "Storefront API access token".
  shopifyDomain: "", // ej: "mireva.cr" o "tu-tienda.myshopify.com"
  storefrontToken: "", // token público de Storefront API

  // Mensaje inicial del pedido enviado por WhatsApp.
  orderGreeting: "¡Hola! 👋 Quiero confirmar mi pedido:",
};
