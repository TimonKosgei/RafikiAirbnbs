# Rafiki Airbnbs — Full-Stack Short-Stay Booking Platform

> **"Feel at home in Kenya"**  
> Boutique Kenyan hospitality platform featuring carefully selected short-stay homes in Nairobi (Kilimani, Kileleshwa, Westlands) with WhatsApp guest concierge, reservation management, and admin dashboard.

---

## 🚀 Quick Start Guide (Local PC)

### 1. Prerequisites
- **Node.js** (v18 or higher recommended) or **Bun** / **pnpm**
- **npm** (comes with Node.js) or **bun**

### 2. Install Dependencies
Open your terminal inside the cloned repository directory:

```bash
npm install
```
*(Or if you use Bun: `bun install`)*

### 3. Configure Supabase
The app reads and writes live data through Supabase. Copy the example environment file and set the project URL and public anon/publishable key:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-public-anon-or-publishable-key"
```

Never put a Supabase service-role key in a `VITE_` variable or in frontend code.
Set `SUPABASE_SERVICE_ROLE_KEY` in `.env` for the server-side email API. Add the Gmail app password as `SMTP_APP_PASSWORD`; the mailer connects to `smtp.gmail.com:587` using STARTTLS by default. Revoke any app password that has been shared in chat or committed to a file.

### 4. Start the Development Server
```bash
npm run dev
```
This starts both the Vite frontend and the server-side Gmail SMTP email API.

The app will start on:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Admin Dashboard Access

Admin access uses Supabase Auth. Create an Auth user in the Supabase dashboard, then grant it an admin profile with the SQL below (replace the values with that user's Auth ID, email, and name):

```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('AUTH-USER-UUID', 'admin@example.com', 'Rafiki Airbnbs Admin', 'admin');
```

Sign in at `http://localhost:3000/admin/login` using that user's Supabase Auth credentials. The frontend checks the profile role, and row-level security limits admin database operations to `admin` and `manager` profiles.

### Admin Capabilities:
- View pending, contacted, and confirmed booking requests.
- Prevent double-booking conflicts automatically.
- 1-click WhatsApp guest messaging with pre-composed inquiry and confirmation messages.
- Manage properties (pricing, descriptions, amenities, gallery images, publishing status).
- Moderate and publish guest reviews.
- Update contact settings (WhatsApp phone number, email, address).

---

## 🗄️ Supabase database setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run these files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_supabase_access.sql`
   - `supabase/seed.sql` (initial properties, images, reviews, and settings)
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` as shown above.
4. Restart the Vite server after changing `.env`.

Without Supabase environment variables, the public site uses local demo data in browser storage. Admin sign-in is disabled in that mode.

## Favicon and social sharing image

Add your assets to `public/brand-assets/`:

- `favicon.ico` — 32x32 or 48x48 square favicon.
- `apple-touch-icon.png` — optional 180x180 square PNG.
- `og-image.png` — 1200x630 social sharing image.

The favicon and Open Graph/Twitter metadata already reference these filenames. After the site is deployed, use the full public URL for the `og:image` and `twitter:image` content values in `index.html` so social networks can fetch the preview image.

## Booking email and recovery

When a booking is created, the email API loads the saved booking from Supabase and sends a confirmation to the guest plus a separate copy to `ADMIN_BOOKING_EMAIL` (defaults to `SMTP_USER`). Guests can open `/booking`, enter their booking reference, or request matching booking details by email. Recovery responses do not reveal whether an address has a booking; details are delivered only to the submitted inbox.

The email API must run as a server-side Node process with `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_USER`, and `SMTP_APP_PASSWORD` configured as private environment variables. The Vite development server proxies the email routes to this process. For production, deploy the Node email API privately (set `EMAIL_API_HOST=0.0.0.0` only inside its isolated server/container) and configure the hosting platform's reverse proxy to route `/api/booking-notifications` and `/api/booking-email-lookup` to it. Do not expose the service-role key or Gmail app password to the frontend.

---

## 📦 Available Scripts

- `npm run dev` — Launches Vite development server on port 3000.
- `npm run build` — Bundles production-optimized static assets in `/dist`.
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Runs TypeScript type-checking without emitting files.
