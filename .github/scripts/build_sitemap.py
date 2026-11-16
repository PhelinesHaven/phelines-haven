#!/usr/bin/env python3
"""Build sitemap.xml from active products and published blog posts in Supabase.

Uses only the public (anon) key, so it sees exactly what visitors can see.
Refuses to overwrite the sitemap if the catalog comes back empty.
"""
import json
import os
import re
import sys
import urllib.request

SUPA = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_KEY"]
SITE = "https://phelineshaven.co.ke"
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def fetch(path):
    rows, start = [], 0
    while True:
        req = urllib.request.Request(
            f"{SUPA}/rest/v1/{path}",
            headers={
                "apikey": KEY,
                "Authorization": "Bearer " + KEY,
                "Range-Unit": "items",
                "Range": f"{start}-{start + 999}",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            batch = json.load(r)
        rows += batch
        if len(batch) < 1000:
            return rows
        start += 1000


def entry(loc, freq, prio, lastmod=None):
    lm = f"<lastmod>{lastmod[:10]}</lastmod>" if lastmod else ""
    return f"  <url><loc>{loc}</loc>{lm}<changefreq>{freq}</changefreq><priority>{prio}</priority></url>"


products = fetch("products?select=slug,updated_at&is_active=eq.true&order=slug")
posts = fetch("blog_posts?select=slug,updated_at&is_published=eq.true&order=slug")

if not products:
    sys.exit("No active products returned; leaving sitemap.xml unchanged.")

lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entry(f"{SITE}/", "daily", "1.0"),
    entry(f"{SITE}/collection.html", "daily", "0.9"),
]
skipped = []
for p in products:
    s = p.get("slug") or ""
    if not SLUG.match(s):
        skipped.append(s)
        continue
    lines.append(entry(f"{SITE}/product.html?product={s}", "weekly", "0.8", p.get("updated_at")))
for b in posts:
    s = b.get("slug") or ""
    if not SLUG.match(s):
        skipped.append(s)
        continue
    lines.append(entry(f"{SITE}/blog.html?slug={s}", "monthly", "0.7", b.get("updated_at")))
lines.append("</urlset>")

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"Wrote {len(products)} products and {len(posts)} posts; skipped invalid slugs: {skipped}")
