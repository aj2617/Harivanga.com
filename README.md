## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values in `.env.local`
3. In Supabase SQL Editor, run [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql)
4. Run the app:
   `npm run dev`

Local product/order fallbacks and the admin test login only run on localhost in development mode.

## Deploy To Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`
- SPA redirect is configured in `netlify.toml` so direct visits and refreshes on routes like `/products` or `/admin` resolve to `index.html`

Add the same Supabase environment values in Netlify.

Enable email/password authentication in Supabase Authentication before going live.

## Deploy To Namecheap Shared Hosting (cPanel)

This is a static site (Vite build). Shared hosting cannot run the Supabase Edge Function itself, but the site can still use Supabase (auth + database) normally.

1. Create a production env file (build-time):
   - Copy `.env.example` to `.env.production`
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - If you are hosting under a subfolder, set `VITE_BASE_PATH` (example: `/shop/`)
2. Build:
   - `npm install`
   - `npm run build`
3. Upload:
   - Upload the **contents** of `dist/` into your cPanel `public_html/` (or the target folder for your domain/addon domain)
4. SPA routing:
   - `public/.htaccess` is included in the build output, so routes like `/products` and `/admin` work on Apache.

If you use the AI assistant in production, deploy the Supabase Edge Function and set `GEMINI_API_KEY` in Supabase secrets (do **not** use `VITE_GEMINI_API_KEY` in production).

## Production Notes

- Admin access is controlled by the `users.role = 'admin'` value in Supabase, not by a hardcoded email.
- Order reads are production-locked to the customer who placed the order or an admin account.
- Guest customers can still complete checkout, and their confirmation page is preserved in the current browser session immediately after purchase.
- If you previously used the older open order-read policy, re-run the updated [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql) before deploying.
