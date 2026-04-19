# Product Requirements — Acrylic Braille Signs e-commerce

## Original Problem Statement
User runs a live e-commerce site (Netlify + FastAPI/Render + MongoDB Atlas + Stripe) selling ADA-compliant braille signs.
The core issue throughout: checkout + admin actions broke whenever the Emergent agent went to sleep, because deployed code was silently falling back to the Emergent preview backend URL. User wants:
1. Checkout that works 24/7 independent of the Emergent agent.
2. A real, reliable Admin Portal (Shopify-like) for managing products, content, reviews, and operations without requiring the agent to be active.

## Architecture (source of truth)
- **Frontend**: React + Vite + Tailwind, hosted on Netlify.
- **Backend**: FastAPI on Render (`https://bsign-backend.onrender.com`), Procfile-driven.
- **Database**: MongoDB Atlas (prod). Local pod uses mongodb://localhost:27017.
- **Payments**: Official `stripe` Python SDK → Stripe hosted Checkout.
- **Email**: Resend API (customer emails currently hardcoded to admin until domain is verified on Resend).
- **Auth**: Custom JWT (HS256, 24h expiry) + bcrypt passwords. Bearer header, token in localStorage.

## Completed This Session (2026-04-19)

### Phase 0 — Reliability & Diagnosis
- Diagnosed Render backend crash: MongoDB Atlas cluster `cluster0.mxkktde.mongodb.net` was unreachable (user re-activated Atlas).
- Made backend resilient: lazy Mongo connection via `db.py`, startup does not crash on DNS/auth errors; app routes still respond.
- Added `/api/health` endpoint (DB ping).
- Removed module-level Mongo init from `payment_routes.py` (was the crash cause).

### Phase 1 — Admin Portal Rebuild
- **Real auth**: bcrypt + JWT. Admin seeded from env at startup (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Seed is idempotent.
- **New backend modules**:
  - `/app/backend/auth.py` — bcrypt + JWT + `require_admin` dependency.
  - `/app/backend/auth_routes.py` — `POST /api/auth/login`, `GET /api/auth/me`, `seed_admin()`.
  - `/app/backend/admin_routes.py` — All `/api/admin/*` routes protected: reviews, content, stats, orders.
  - `/app/backend/product_routes.py` — Public `GET /api/products`, admin CRUD `/api/admin/products`.
  - `/app/backend/db.py` — Lazy Mongo singleton.
- **Frontend**:
  - `/app/frontend/src/config/api.ts` — Central `BACKEND_URL` + `API_ENDPOINTS` (defaults to Render if env empty).
  - `/app/frontend/src/lib/api.ts` — `apiFetch` helper with Bearer JWT + auto-logout on 401.
  - `/app/frontend/src/contexts/AuthContext.tsx` — Real API login, no more client-side password check.
  - `/app/frontend/src/pages/AdminPanel.tsx` — Rebuilt with 5 tabs: Products, Content, Reviews, Orders, Settings. Live stats widget.
  - `/app/frontend/src/components/admin/ProductManager.tsx` — Full product CRUD UI (name, price, category, images, gallery, sizes, colors, materials, features, published/featured/in-stock toggles, delete confirm dialog).
  - Removed 6 stale Emergent-URL fallbacks (Contact, ModernContact, ProductReviews, NewsletterSignup, CustomSizeRequest, AdminPanel).

### Legacy Admin Purge (2026-04-19 follow-up)
- User reported they were still seeing the OLD admin UI. Root cause: a floating `EditorToolbar.tsx` rendered on every page opened an old `AdminMode.tsx` modal that wrote to localStorage (not MongoDB).
- Neutralized all legacy admin components to no-ops/passthroughs so no code churn in consumer pages:
  - `EditorToolbar.tsx` → returns `null`
  - `AdminMode.tsx` → returns `null`
  - `ProductEditorModal.tsx` → returns `null`
  - `PageEditor.tsx` / `DraggableSection.tsx` → passthrough wrappers
  - `EditableProductCard.tsx` → delegates to plain `ProductCard`
  - `InlineEditor.tsx` / `ImageEditor.tsx` → plain text/img
  - `EditorContext.tsx` → rewritten as read-only provider for header/footer data; all mutators are no-ops; `isEditing`/`isPreviewing` permanently false
- Added `data-testid="header-admin-link"` Admin button in Header visible only when `isAdmin` — routes to `/admin`.
- Testing agent iteration 2 confirmed: zero floating toolbar on /, /products, /about, /cart, /collections/best-sellers, /products/staff-ada-sign; no console errors; anonymous side 100% verified.

### Admin Email Change
- Admin seed email updated to `kevin@decalmax.ca` in both local pod and `/app/memory/test_credentials.md`.
- Old admin record removed from local Mongo. User must also update Render env vars `ADMIN_EMAIL` and `ADMIN_PASSWORD` for production.

## Backlog / Roadmap

### P0 — Deploy to production
- User to click "Save to GitHub" → Netlify auto-deploys frontend with new config.
- User to set the same env vars on Render: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- User to upgrade Render to Starter ($7/mo) for true 24/7.

### P1 — Next session (Phase 2)
- **Product seed migration**: port hardcoded products from `src/data/productsData.ts` + `bestSellersProducts.ts` into MongoDB as a one-time migration, so admin can edit existing catalog (not just new products).
- **Public frontend integration**: progressively switch product rendering pages (AllProducts, FeaturedProducts, ProductDetail) to fetch from `/api/products`.
- **Media library**: object storage integration (Cloudinary or Emergent object storage). Render has no persistent disk.
- **Pricing rules**: global % adjust, promo toggle.
- **Review approval queue**: `status=pending|approved|hidden`, admin moderates before display.

### P2
- Rich WYSIWYG upgrade (TipTap or Lexical).
- Version history / rollback.
- Staff roles & permissions.
- Audit log.
- Stripe webhook for `checkout.session.completed` as order-of-truth (retries for 3 days).
- Resend domain verification → revert customer emails to dynamic `order_data["customer_email"]`.

### P3 / Nice-to-have
- Bulk import/export products via CSV.
- Draft/publish workflow for content.
- SEO fields on products (meta title, description, canonical).

## Known Constraints / Watchouts
- Render free tier spins down after 15 min idle — upgrade required for 24/7.
- Resend domain `acrylicbraillesigns.com` not verified → customer confirmation emails go to admin only until verified.
- `frontend/.env` in the local pod points to the Emergent preview URL for local dev; Netlify build uses the hardcoded Render URL in `config/api.ts` when env is empty. Do NOT commit dev-env URLs as production defaults.
