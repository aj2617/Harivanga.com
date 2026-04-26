# Harivanga.com

Premium mango e-commerce platform for selling tree-ripened, chemical-free Harivanga and other mangoes from Rangpur, Bangladesh.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Supabase (Auth, PostgreSQL, Row Level Security)
- **Edge Functions**: Deno (order notifications via Resend, AI chat via Gemini)
- **Routing**: React Router Dom 7
- **Icons**: Lucide React
- **Fonts**: Inter (body), Playfair Display (display headings), Tiro Bangla (Bangla text)

## Project Structure

```
src/
├── components/          # Shared UI components
│   ├── AnnouncementBar.tsx   # Top bar with phone/delivery info
│   ├── BrandLogo.tsx         # Logo component
│   ├── Footer.tsx            # Site footer
│   ├── Layout.tsx            # Page wrapper with Navbar + Footer
│   ├── Navbar.tsx            # Sticky navbar
│   └── UnifiedContactWidget.tsx  # Floating chat/contact widget
├── context/             # Global state
│   ├── AuthContext.tsx       # Supabase authentication
│   └── CartContext.tsx       # Shopping cart (localStorage)
├── features/            # Feature modules
│   ├── admin/               # Admin dashboard components
│   ├── orders/              # Order tracking
│   └── products/            # Product card, listing hooks
├── lib/                 # Utilities & helpers
│   ├── adminSettings.ts     # Admin settings sync
│   ├── dates.ts             # Date formatting
│   ├── delivery.ts          # Delivery charge calculation
│   ├── env.ts               # Environment checks
│   ├── format.ts            # Currency formatting (BDT)
│   ├── imageSources.ts      # Image optimization
│   ├── localDevProducts.ts  # Dev fallback products
│   └── localDevOrders.ts    # Dev fallback orders
├── pages/               # Route components
│   ├── AdminDashboard.tsx   # Full admin panel (products/orders/settings)
│   ├── CartPage.tsx         # Shopping cart
│   ├── Checkout.tsx         # Full checkout flow
│   ├── Home.tsx             # Homepage (hero, products, why us)
│   ├── OrderConfirmation.tsx
│   ├── ProductDetail.tsx    # Single product detail page
│   └── ProductListing.tsx   # Product grid with filters
└── index.css            # Design tokens + global styles
```

## Design System

- **Primary**: `#FF6B35` (mango orange)
- **Accent**: `#F5A623` (mango yellow/amber)
- **Dark**: `#1A1A1A` (charcoal)
- **Background**: `#FAFAF8` (warm white)
- CSS classes: `mango-orange`, `mango-yellow`, `mango-dark`, `mango-green`, `mango-cream`

## Key Features

- Full e-commerce flow: browse → cart → checkout (bKash/Nagad/Cash on Delivery)
- Admin dashboard: product/order management, settings, home promotion
- AI chat assistant (Gemini-powered, Bangla-speaking)
- Order tracking by phone or order ID
- Automated email notifications for new orders (Resend)
- Floating contact widget (phone, WhatsApp, AI chat)

## Environment Variables Required

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Development

```bash
npm run dev    # Start at port 5000
npm run build  # Production build
```
