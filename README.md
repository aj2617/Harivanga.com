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

## Order Notifications (Email / WhatsApp)

This repo includes a Supabase Edge Function that can notify you when a new order is placed. The checkout page calls it after the order is created.

1. Create the `order_notifications` table:
   - In Supabase SQL Editor, re-run `supabase/schema.sql` (safe to run multiple times).
2. Deploy the function:
   - `supabase functions deploy order-notifications`
3. Set required secrets in Supabase (choose 1+ channels):
   - For Email (Resend): `RESEND_API_KEY`, `NOTIFY_ADMIN_EMAIL`, `NOTIFY_EMAIL_FROM`
   - For WhatsApp (Twilio): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `NOTIFY_WHATSAPP_TO`
   - Service role key: Supabase usually injects `SUPABASE_SERVICE_ROLE_KEY` automatically into Edge Functions. If it's missing in your project, add a secret named `SERVICE_ROLE_KEY` (used only inside the Edge Function to load the order + record delivery).

If no channel is configured, the order still completes, but the notification attempt will fail (and a warning is logged in the browser console).

## GitHub -> Namecheap cPanel Deploy (no Node.js on server)

Namecheap shared hosting typically cannot run Node builds on the server. The easiest Git-based flow is:

1. GitHub Actions builds `dist/` and publishes it to a separate branch named `cpanel`.
2. cPanel pulls/deploys the `cpanel` branch into `public_html/`.

### 1) Configure GitHub Secrets

In GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

- `VITE_SUPABASE_URL` = `https://YOUR_PROJECT.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = your anon/publishable key
- Optional `VITE_BASE_PATH` = `/shop/` (only if hosting in a subfolder; leave empty for root)

The workflow file is `.github/workflows/deploy-cpanel.yml`. It runs on every push to `main` and updates the `cpanel` branch.

### 2) Deploy in cPanel

cPanel → **Git Version Control**:

- Create/clone the repository (use the repo SSH URL; add an SSH key if needed).
- Set the repository branch to `cpanel`.
- Set the deploy path to your document root (usually `public_html/` or your addon domain root).
- Use **Pull/Deploy** after each update (or enable auto-deploy if your cPanel supports it).

## Production Notes

- Admin access is controlled by the `users.role = 'admin'` value in Supabase, not by a hardcoded email.
- Order reads are production-locked to the customer who placed the order or an admin account.
- Guest customers can still complete checkout, and their confirmation page is preserved in the current browser session immediately after purchase.
- If you previously used the older open order-read policy, re-run the updated [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql) before deploying.
