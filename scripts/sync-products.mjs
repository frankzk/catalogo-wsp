#!/usr/bin/env node
/*
 * Regenera data/products.json desde la Admin API de Shopify.
 * Útil si NO quieres usar la Storefront API en vivo.
 *
 * Uso:
 *   export SHOPIFY_STORE="tu-tienda.myshopify.com"
 *   export SHOPIFY_ADMIN_TOKEN="shpat_xxx"
 *   node scripts/sync-products.mjs
 *
 * Solo incluye productos activos y disponibles para la venta.
 */
import { writeFile } from "node:fs/promises";

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-10";

if (!STORE || !TOKEN) {
  console.error("Faltan SHOPIFY_STORE y/o SHOPIFY_ADMIN_TOKEN.");
  process.exit(1);
}

const endpoint = `https://${STORE.replace(/^https?:\/\//, "")}/admin/api/${API_VERSION}/graphql.json`;

const QUERY = `query($cursor: String) {
  products(first: 100, after: $cursor, query: "status:active") {
    pageInfo { hasNextPage endCursor }
    edges { node {
      title productType
      featuredMedia { preview { image { url } } }
      variants(first: 50) { edges { node {
        id title price availableForSale
      } } }
    } }
  }
}`;

async function gql(cursor) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query: QUERY, variables: { cursor } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.products;
}

async function main() {
  const products = [];
  let cursor = null;
  let currency = "PEN";

  for (let page = 0; page < 50; page++) {
    const conn = await gql(cursor);
    for (const { node } of conn.edges) {
      const variants = node.variants.edges
        .map(({ node: v }) => ({
          id: v.id,
          title: v.title === "Default Title" ? "Default" : v.title,
          price: parseFloat(v.price || 0),
          available: v.availableForSale,
        }))
        .filter((v) => v.available);
      if (!variants.length) continue;
      products.push({
        id: node.title,
        title: node.title,
        type: node.productType || "Otros",
        image: node.featuredMedia?.preview?.image?.url || "",
        variants,
      });
    }
    if (!conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }

  products.sort((a, b) => a.title.localeCompare(b.title, "es"));

  const out = {
    _comment: "Generado por scripts/sync-products.mjs. No editar a mano.",
    currency,
    generatedAt: new Date().toISOString(),
    products,
  };
  await writeFile(new URL("../data/products.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  console.log(`✓ ${products.length} productos escritos en data/products.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
