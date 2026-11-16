const SUPABASE_URL=process.env.SUPABASE_URL||"https://fuckvbsuhjdknguutnxc.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_KEY||"sb_publishable_xnx5yh1HPcxZlCMF86d2Ow_v-B49rj8";
const SITE="https://phelineshaven.co.ke";
async function api(path){const r=await fetch(SUPABASE_URL+path,{headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY}});if(!r.ok)throw new Error(path+" -> "+r.status);return r.json();}
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const cats=await api("/rest/v1/categories?select=slug,name&is_active=eq.true&order=name.asc");
const blogs=await api("/rest/v1/blog_posts?select=slug&is_published=eq.true&order=published_at.desc");
const urls=new Set([SITE+"/",SITE+"/blog.html"]);
for(const c of cats){if(c.slug)urls.add(SITE+"/"+c.slug+".html");}
for(const b of blogs){if(b.slug)urls.add(SITE+"/blog-post.html?slug="+encodeURIComponent(b.slug));}
let xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for(const u of urls)xml+=`  <url><loc>${esc(u)}</loc></url>\n`;
xml+="</urlset>\n";
await import("node:fs/promises").then(fs=>fs.writeFile("sitemap.xml",xml));
await import("node:fs/promises").then(fs=>fs.writeFile("robots.txt",`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\nSitemap: ${SITE}/product-sitemap.xml\n`));
console.log("Generated sitemap with",urls.size,"URLs.");
