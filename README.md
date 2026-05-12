# GCashFin — Full-Stack Financial Management System

A production-ready Next.js 14 application for GCash account and salary tracking.

---

## ✅ Features

- **Authentication** — Login & Register with JWT sessions (NextAuth.js)
- **Dashboard** — Account management, real-time stats, transaction history
- **Salary Tracker** — Daily profit/expense tracking with monthly spreadsheet view
- **Reports** — Daily, monthly, account, and transaction reports with CSV export
- **Analytics** — Interactive charts (Recharts) with trend, monthly, and usage data
- **Settings** — Profile management, display preferences, data export

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js (JWT) |
| Charts | Recharts |
| State | TanStack Query |
| Toast | react-hot-toast |

---

## 🚀 Setup & Deployment

### 1. Clone and install

```bash
git clone <your-repo>
cd gcashfin
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://user:password@host:5432/gcashfin"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="https://yourdomain.com"
```

### 3. Set up database

```bash
npx prisma generate
npx prisma db push
npm run db:seed    # Creates demo admin: admin@gcashfin.com / admin123
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Production

**Vercel (recommended):**
```bash
npm install -g vercel
vercel
```

**In Vercel Dashboard:**
1. Go to your project settings
2. Add these environment variables:
   - `DATABASE_URL` = your Neon PostgreSQL connection string
   - `NEXTAUTH_SECRET` = run `openssl rand -base64 32` locally
   - `NEXTAUTH_URL` = your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

**Important Notes:**
- Make sure your Neon database allows connections from `0.0.0.0/0` (all IPs)
- The app will automatically run `prisma generate` during build
- Use `/api/health` to check if deployment is working

**Railway / Render / Fly.io:**
```bash
npm run build
npm start
```

---

## 🗄 Database Providers (Free)

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Neon** | 500 MB | Best for Vercel |
| **Supabase** | 500 MB | Full Postgres |
| **Railway** | 100 MB | Easy setup |
| **PlanetScale** | MySQL | Need to change schema |

---

## 👤 Default Login (after seeding)

```
Email:    admin@gcashfin.com
Password: admin123
```

**Change this immediately in production!**

---

## 📁 Project Structure

```
gcashfin/
├── app/
│   ├── (app)/                  # Protected pages (requires auth)
│   │   ├── layout.tsx          # Shared layout with Navbar
│   │   ├── dashboard/page.tsx  # Main dashboard
│   │   ├── salary/page.tsx     # Salary tracker
│   │   ├── reports/page.tsx    # Reports
│   │   ├── analytics/page.tsx  # Analytics + charts
│   │   └── settings/page.tsx   # Settings
│   ├── api/
│   │   ├── auth/               # NextAuth + register
│   │   ├── accounts/           # CRUD accounts
│   │   ├── transactions/       # Transaction history
│   │   ├── salary/             # Salary entries
│   │   ├── analytics/          # Analytics data
│   │   ├── reports/            # Report data
│   │   ├── settings/           # User settings
│   │   └── dashboard/          # Dashboard stats
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── layout.tsx
│   ├── page.tsx                # Redirects to /dashboard or /login
│   ├── providers.tsx
│   └── globals.css
├── components/
│   └── layout/Navbar.tsx
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client
│   └── utils.ts                # Helpers
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Demo data
├── types/index.ts
├── middleware.ts               # Route protection
└── .env.example
```
