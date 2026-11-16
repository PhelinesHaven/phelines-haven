import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://fuckvbsuhjdknguutnxc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_xnx5yh1HPcxZlCMF86d2Ow_v-B49rj8";
const SITE = "https://phelineshaven.co.ke";

async function api(endpoint) {
  const r = await fetch(SUPABASE_URL + endpoint, {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY }
  });
  if (!r.ok) throw new Error(endpoint + " -> " + r.status);
  return r.json();
}
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
const text = s => String(s ?? "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
const money = n => "KSh " + Number(n || 0).toLocaleString("en-KE");

const products = await api("/rest/v1/products?select=id,name,slug,description,brand,sku,price,compare_at_price,stock_quantity,low_stock_threshold,seo_title,seo_description,category_id&is_active=eq.true&order=name.asc");
const images = await api("/rest/v1/product_images?select=product_id,storage_path,alt_text,sort_order&order=sort_order.asc");
const categories = await api("/rest/v1/categories?select=id,name");
const catMap = new Map(categories.map(c => [String(c.id), c.name]));
const imageMap = new Map();
for (const i of images) if (!imageMap.has(i.product_id) && i.storage_path) imageMap.set(i.product_id, i.storage_path);

fs.rmSync("product", { recursive: true, force: true });
fs.mkdirSync("product", { recursive: true });

const urls = [];
for (const p of products) {
  if (!p.slug) continue;
  const url = SITE + "/product/" + encodeURIComponent(p.slug) + "/";
  const category = catMap.get(String(p.category_id)) || "Beauty & Lifestyle";
  const image = imageMap.get(p.id) || "";
  const description = text(p.description || p.seo_description || ("Shop " + p.name + " in Kenya at Pheline's Haven."));
  const title = text(p.seo_title || (p.name + " | Pheline's Haven Kenya")).slice(0, 65);
  const seo = text(p.seo_description || description).slice(0, 160);
  const stock = Number(p.stock_quantity || 0);
  const availability = stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const schema = {
    "@context":"https://schema.org",
    "@type":"Product",
    "name":p.name,
    "description":description,
    "sku":p.sku || undefined,
    "brand":{"@type":"Brand","name":p.brand || "Pheline's Haven"},
    "image": image ? [image] : undefined,
    "offers":{"@type":"Offer","url":url,"priceCurrency":"KES","price":Number(p.price || 0),"availability":availability}
  };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(seo)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Pheline's Haven">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(seo)}">
<meta property="og:url" content="${esc(url)}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(seo)}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ""}
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},{"@type":"ListItem","position":2,"name":category,"item":SITE+"/collection.html"},{"@type":"ListItem","position":3,"name":p.name,"item":url}]})}</script>
<style>
body{margin:0;font-family:Arial,sans-serif;color:#211525;background:#fff}main{max-width:1100px;margin:auto;padding:36px 20px}.crumb{font-size:12px;color:#6f6473;margin-bottom:25px}.grid{display:grid;grid-template-columns:minmax(280px,1fr) minmax(280px,1fr);gap:45px;align-items:start}.photo{background:#f7f3f8;min-height:320px;display:flex;align-items:center;justify-content:center}.photo img{width:100%;max-height:620px;object-fit:contain}.name{font:600 clamp(32px,5vw,58px)/1.08 Georgia,serif;color:#26003f;margin:0 0 16px}.cat{color:#e60091;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}.price{font-size:25px;font-weight:800;color:#5d1198;margin:20px 0}.old{text-decoration:line-through;color:#998e9f;font-size:14px;margin-left:10px;font-weight:400}.desc{font-size:15px;line-height:1.9;color:#6f6473;white-space:pre-line}.stock{font-weight:700;margin:18px 0}.btn{display:inline-block;background:#5d1198;color:#fff;padding:15px 22px;text-decoration:none;font-weight:800;font-size:11px;letter-spacing:1px}.meta{margin-top:28px;padding-top:20px;border-top:1px solid #eee5f0;font-size:12px;color:#6f6473}.notice{margin-top:30px;padding:18px;background:#faf7fb;border:1px solid #eee5f0;font-size:12px;line-height:1.7}@media(max-width:700px){.grid{grid-template-columns:1fr}.name{font-size:40px}}
</style>
</head>
<body>
<main>
<div class="crumb"><a href="/">Home</a> / <a href="/collection.html">Shop</a> / ${esc(category)} / ${esc(p.name)}</div>
<div class="grid">
<div class="photo">${image ? `<img src="${esc(image)}" alt="${esc(p.name)}" loading="eager">` : "<span>Product image coming soon</span>"}</div>
<section>
<div class="cat">${esc(category)}</div>
<h1 class="name">${esc(p.name)}</h1>
<div class="price">${money(p.price)}${p.compare_at_price && Number(p.compare_at_price)!==Number(p.price) ? `<span class="old">${money(p.compare_at_price)}</span>` : ""}</div>
<div class="stock">${stock > 0 ? "In stock" : "Currently out of stock"}</div>
<div class="desc">${esc(description)}</div>
<div class="notice">Pheline's Haven Kenya — beauty, haircare, fashion and lifestyle shopping with nationwide delivery options.</div>
<p><a class="btn" href="${esc(url)}">VIEW PRODUCT & BUY</a></p>
<div class="meta"><strong>Brand:</strong> ${esc(p.brand || "Pheline's Haven")}<br><strong>SKU:</strong> ${esc(p.sku || "Not listed")}<br><strong>Category:</strong> ${esc(category)}</div>
</section>
</div>
</main>
</body>
</html>`;
  const dir = path.join("product", p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  urls.push({url, lastmod:p.updated_at || p.created_at || new Date().toISOString(), image});
}

const xmlEsc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
for (const u of urls) {
  sm += `  <url><loc>${xmlEsc(u.url)}</loc><lastmod>${xmlEsc(new Date(u.lastmod).toISOString())}</lastmod>${u.image ? `<image:image><image:loc>${xmlEsc(u.image)}</image:loc></image:image>` : ""}</url>\n`;
}
sm += "</urlset>\n";
fs.writeFileSync("product-sitemap.xml", sm);
console.log("Generated", urls.length, "SEO product pages.");
