# Automated SEO, Images and Google Discovery

## GitHub Actions secrets

Add these repository secrets under **Settings → Secrets and variables → Actions**:

- `SUPABASE_URL`: `https://fuckvbsuhjdknguutnxc.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase **service role secret**. Never put this in frontend code.
- `BING_IMAGE_SEARCH_KEY`: optional Bing Image Search API key. If omitted, image enrichment still uses supplier-page Open Graph images when available.
- `GOOGLE_SERVICE_ACCOUNT_JSON`: the complete Google Cloud service-account JSON key.
- `BING_INDEXNOW_KEY`: optional Bing IndexNow key.

## Google Search Console setup

Google's Search Console API can programmatically submit sitemaps. It does not guarantee indexing; sitemap submission is a crawling hint.

1. Open Google Cloud Console and create/select a project.
2. Enable **Google Search Console API**.
3. Create a service account.
4. Create a **JSON** key and download it once.
5. Open Google Search Console and add/verify `https://phelineshaven.co.ke/` as a property.
6. In Search Console → Settings → Users and permissions, add the service-account email from the JSON `client_email` field as an owner.
7. In GitHub → repository → Settings → Secrets and variables → Actions → New repository secret:
   - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Value: paste the entire JSON file contents.
8. Run **Search engine discovery** manually once to verify authentication.

The workflow submits:
- `https://phelineshaven.co.ke/sitemap.xml`
- `https://phelineshaven.co.ke/product-sitemap.xml`

## Image enrichment

The enrichment workflow runs manually, every 15 minutes, and can also be triggered with a GitHub `repository_dispatch` event named `product-catalog-updated`.

It:
1. Reads active Supabase products.
2. Generates Kenya-localized descriptions and SEO metadata when missing/thin.
3. Reuses existing images first.
4. Attempts a supplier-page Open Graph image.
5. Optionally searches Bing Images.
6. Downloads a verified image response.
7. Uploads it to the public Supabase `product-images` bucket.
8. Stores the public URL in `products.image_url` and `product_images.storage_path`.

Only use supplier/product images that you have permission to use commercially.

## Google Indexing API note

The Google Indexing API is **not a general ecommerce product indexing API**. Google documents it for supported content such as JobPosting and livestream pages. Pheline's Haven product/category discovery therefore uses the supported Search Console sitemap submission flow instead, plus Bing IndexNow where configured.
