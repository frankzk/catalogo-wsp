# Catálogo WhatsApp

Catálogo web que se le envía al cliente **después** de confirmar el pedido (vía iConfly u otra asesora). El cliente:

1. Abre el link y ve los productos con foto y precio, **igual que el catálogo de WhatsApp Business**.
2. **Agrega al carrito** lo que quiera y elige la **cantidad** de cada producto.
3. Con **un solo clic** nos envía el pedido por **WhatsApp** (mensaje ya armado, no tiene que escribir nada).

Sin PDF, sin que el cliente tenga que redactar su pedido. Lo más práctico posible.

## Cómo funciona (resumen técnico)

- **100% estático** (HTML + CSS + JS). No necesita servidor: se publica en GitHub Pages, Vercel, Netlify o cualquier hosting de archivos.
- El botón **"Enviar pedido por WhatsApp"** abre un enlace `https://wa.me/<número>?text=<pedido>` con el detalle (productos, cantidades y total) ya escrito hacia el número del negocio.
- Los productos se cargan de **Shopify en vivo** (Storefront API) si está configurado; si no, usa `data/products.json` (incluido como respaldo de muestra).

## Configuración (lo único que tienes que editar)

Abre **`config.js`** y completa:

| Campo | Qué es |
|-------|--------|
| `storeName` | Nombre que aparece en la cabecera. |
| `whatsappNumber` | **Número del negocio** que recibe los pedidos. Solo dígitos, con código de país. Perú: `51` + número (ej. `51987654321`). |
| `shopifyDomain` | (Opcional) Dominio de la tienda, ej. `kenku.pe`. |
| `storefrontToken` | (Opcional) Token público de la Storefront API. |
| `orderGreeting` | Texto inicial del mensaje del pedido. |

> ⚠️ Lo mínimo para que funcione: poner tu `whatsappNumber`. Con eso ya opera usando el catálogo de muestra.

### Conectar el catálogo completo de Shopify (recomendado)

Para que el catálogo esté **siempre sincronizado** con Shopify, crea un token público de Storefront (una sola vez):

1. Shopify Admin → **Configuración → Apps y canales de venta → Desarrollar apps**.
2. **Crear una app** (ej. "Catálogo WhatsApp").
3. Pestaña **Configuración de Storefront API** → activar los permisos:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory` (para saber stock)
4. **Instalar la app** y copiar el **Storefront API access token**.
5. Pega ese token en `storefrontToken` y el dominio en `shopifyDomain` dentro de `config.js`.

Ese token es **público y de solo lectura** del escaparate: es seguro dejarlo en el navegador. **Nunca** uses aquí el token de la Admin API.

## Publicar

Cualquier hosting estático sirve. La forma más rápida con este repo es **GitHub Pages**:

1. Sube el repo a GitHub.
2. Settings → Pages → Source: rama `main` (o la que uses), carpeta `/ (root)`.
3. El catálogo queda en `https://<usuario>.github.io/catalogo-wsp/`.

Ese es el link que le envías al cliente.

## Actualizar el catálogo de muestra (sin Storefront API)

Si prefieres no usar la Storefront API, puedes regenerar `data/products.json` desde la Admin API con el script incluido:

```bash
export SHOPIFY_STORE="tu-tienda.myshopify.com"
export SHOPIFY_ADMIN_TOKEN="shpat_xxx"   # token de Admin API (NO se publica)
node scripts/sync-products.mjs
```

El archivo `data/products.json` resultante se commitea y publica con el sitio.

## Estructura

```
index.html          # estructura de la página
styles.css          # estilo tipo WhatsApp Business
app.js              # carga de productos, carrito y envío por wa.me
config.js           # ⬅️ configuración editable (número, tienda, Shopify)
data/products.json  # catálogo de muestra / respaldo
scripts/sync-products.mjs  # (opcional) regenera products.json desde Shopify Admin
```
