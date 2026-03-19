## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optional `GEMINI_API_KEY` values in `.env.local`
3. In Supabase SQL Editor, run [supabase/schema.sql](/c:/Users/Lenovo/Desktop/MangoBD/supabase/schema.sql)
4. Run the app:
   `npm run dev`

## Deploy To Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`
- SPA redirect is configured in `netlify.toml` so direct visits and refreshes on routes like `/products` or `/admin` resolve to `index.html`

Add the same Supabase environment values in Netlify.

Also configure Google as an auth provider in Supabase and add your Netlify domain plus local origin as allowed redirect URLs.
