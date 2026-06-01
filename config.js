/*
 * Configuración del catálogo. Edita estos valores y vuelve a publicar.
 * Este archivo se carga ANTES que app.js, así que define window.CATALOG_CONFIG.
 *
 * El token de Storefront es PÚBLICO por diseño (solo lectura del escaparate),
 * por eso es seguro dejarlo en el navegador. NO uses aquí el token de Admin API.
 */
window.CATALOG_CONFIG = {
  // Nombre de la tienda (aparece en la cabecera).
  storeName: "Kenku Perú",

  // Título y subtítulo del catálogo (sensación de acceso exclusivo).
  headline: "Acceso exclusivo",
  subtitle: "Primera compra · 25% OFF + envío gratis",

  // Número de WhatsApp del negocio AL QUE llega el pedido.
  // Formato internacional, solo dígitos (sin +, espacios ni guiones).
  // Perú = 51 + número. Ejemplo: 51987654321
  // ⚠️ REEMPLAZA este valor por tu número real.
  whatsappNumber: "51918100477",

  // Descuento aplicado a TODOS los precios (en %). El envío ya va incluido aquí.
  discountPercent: 25,

  // Nota de envío que se muestra y se incluye en el pedido.
  shippingNote: "Envío gratis incluido 🎉",

  // ---- Conexión en vivo con Shopify (opcional pero recomendado) ----
  // Si completas estos dos campos, el catálogo se carga EN VIVO desde Shopify
  // (siempre actualizado). Si los dejas vacíos, se usa data/products.json.
  //
  // Cómo obtener el token (1 sola vez):
  //   Shopify Admin → Configuración → Apps y canales de venta →
  //   "Desarrollar apps" → Crear una app → Configurar Storefront API →
  //   marcar "unauthenticated_read_product_listings" (y _read_product_inventory)
  //   → Instalar → copiar el "Storefront API access token".
  shopifyDomain: "", // ej: "kenku.pe" o "tu-tienda.myshopify.com"
  storefrontToken: "", // token público de Storefront API

  // Mensaje inicial del pedido enviado por WhatsApp.
  orderGreeting: "¡Hola! 👋 Quiero confirmar mi pedido:",
};
