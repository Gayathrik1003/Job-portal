## Sarkar Daily Jobs

A full‑stack job portal built with Next.js App Router. It supports two roles (Job Seeker and Employer), applications with Q&A, profiles, notifications, and Razorpay payments for job‑seeker account activation. Data is stored in Postgres (Neon serverless).

### Tech Stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui components
- **DB**: Postgres via `@neondatabase/serverless`
- **Auth**: Custom JWT (cookies) using `jose`

### Features
- Job listings and details
- Job applications with required questions
- Employer dashboard: manage jobs, applications, and Q&A
- Job seeker dashboard: profiles, resumes, notifications

---

## Getting Started

### 1) Prerequisites
- Node.js 18+ (recommended 20+)
- pnpm or npm
- A Postgres database (Neon recommended)

### 2) Clone and install
```bash
pnpm install
# or
npm install
```

### 3) Configure environment
Create a `.env.local` in the project root (use the values from the `env.example` included here):

```bash
DATABASE_URL=postgres://... # Neon connection string
JWT_SECRET=your-strong-secret
```

Notes:
- `DATABASE_URL` is required by `lib/db.ts`.
- `JWT_SECRET` is used to sign/verify tokens in `lib/auth.ts`.

### 4) Create database schema and seed (optional)
SQL files are provided in `scripts/`.

If you use Neon, run these in order:
1. `scripts/01-create-tables.sql`
2. Optionally apply additional migrations in numeric order

### 5) Run the app
```bash
pnpm dev
# or
npm run dev
```
Open http://localhost:3000

### 6) Build and start
```bash
pnpm build && pnpm start
# or
npm run build && npm start
```

---

## Environment Variables
The app references these variables:

- `DATABASE_URL` (required)
- `JWT_SECRET` (required)
- `NODE_ENV` (handled by framework)
- `VERCEL_URL` and `VERCEL_ENV` (used in cookie/redirect handling when deployed to Vercel)

See `env.example` for a starter template.

---


## Project Structure (partial)
```
app/
  api/
  employer/
  seeker/
components/
lib/
scripts/
```

---

## Deployment
- Works well on Vercel. Set the same env vars in your project settings.
- Ensure `JWT_SECRET`, `DATABASE_URL`, and Razorpay keys are configured.

---

## Development Notes
- SQL is executed with `@neondatabase/serverless` via the `sql` tagged helper in `lib/db.ts`.
- JWT cookies are set by auth routes and use secure/samesite options adjusted for prod/preview.
- For local dev without HTTPS, cookies are non-secure; in prod (or Vercel preview) they are secure.

---

## License
MIT (or your preferred license)


