# Test Credentials

## Admin Account (seeded on backend startup from backend/.env)
- Email: `kevinpluciano@gmail.com`
- Password: `Ke34023616@`
- Role: `admin`

## URLs
- Backend (preview / dev pod external): `https://checkout-flow-176.preview.emergentagent.com`
- Backend (Render production): `https://bsign-backend.onrender.com`
- MongoDB (dev pod): `mongodb://localhost:27017` / DB `bsign_store`

## Notes
- Auth: Bearer JWT (HS256, 24h expiry). No httpOnly cookies in this implementation — token stored in localStorage by frontend.
- bcrypt hash prefix: `$2b$` (verified via seed_admin inserting through hash_password).
- `seed_admin()` on startup is idempotent: creates admin if missing, updates password_hash if env password changed, enforces role=admin.
- Public signup is disabled in AuthContext.register — admin-only system.
