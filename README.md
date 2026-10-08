# Rafiki Living — Full-Stack Short-Stay Booking Platform

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

### 3. Setup Environment Variables (Optional)
The application works immediately out-of-the-box with built-in mock data and local browser persistence. If you want to customize your setup:

```bash
cp .env.example .env
```

### 4. Start the Development Server
```bash
npm run dev
```
*(Or with Bun: `bun run dev`)*

The app will start on:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Admin Dashboard Access

1. Open your browser and navigate to:  
   👉 **`http://localhost:3000/admin/login`**
2. Use the default administrative credentials:
   - **Email:** `admin@rafikiliving.com`
   - **Password:** `RafikiAdmin2026!`
   *(There is also a convenient "Fill Default Admin Credentials" button on the login screen for 1-click access)*

### Admin Capabilities:
- View pending, contacted, and confirmed booking requests.
- Prevent double-booking conflicts automatically.
- 1-click WhatsApp guest messaging with pre-composed inquiry and confirmation messages.
- Manage properties (pricing, descriptions, amenities, gallery images, publishing status).
- Moderate and publish guest reviews.
- Update contact settings (WhatsApp phone number, email, address).

---

## 🗄️ Optional: Connecting Supabase

To connect a live Supabase PostgreSQL database:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the migration script:
   - `supabase/migrations/001_initial_schema.sql`
   - (Optional seed data) `supabase/seed.sql`
3. Add your keys to `.env`:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

---

## 📦 Available Scripts

- `npm run dev` — Launches Vite development server on port 3000.
- `npm run build` — Bundles production-optimized static assets in `/dist`.
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Runs TypeScript type-checking without emitting files.
