# SWE Prep OS — Google SDE-1 tracker

A personal preparation workspace for a 6–7 month Google SDE-1 plan. Built with Next.js 14, React, TypeScript, Supabase Auth + PostgreSQL, and Vercel.

## What is implemented

- Overview dashboard, roadmap milestones, daily study journal, DSA problem log, export-to-JSON.
- Email/password sign-up and sign-in using Supabase Auth.
- Cloud persistence: the authenticated user's complete tracker state is saved in `public.user_workspace.payload` (JSONB). The browser also keeps a local backup in `localStorage`.
- Automatic sync after edits (debounced ~700 ms); row-level security restricts each user to their own row.
- No LeetCode/NeetCode API connection yet. Problem URLs and independent reflections are manual.
- Evidence is currently recorded as a URL. SQL provisions a private Storage bucket/policies for a future upload control; uploads are not yet exposed in the UI.
- Mock rubric, AI mentor, and integrations are planned—not implemented.

## Requirements

- Node.js 20 LTS or newer (Node 20 recommended), npm, Git, and a GitHub account.
- Supabase account (free tier) and Vercel account (Hobby tier for personal use).

## A. Run locally

1. Unzip this project and open a terminal in its directory.
2. Install packages:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill the Supabase URL + publishable/anon key (steps B1–B3 below). If you leave these unset, the app runs in local-only mode with browser storage.
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000. Stop with Ctrl+C.
6. Check a production build before deploying:
   ```bash
   npm run build
   ```

## B. Create the Supabase backend (free tier)

### B1 — Create a project

1. Go to https://supabase.com and sign in.
2. Select **New project**; choose an organization, project name (e.g. `swe-prep-os`), a strong database password, and a region close to you (India region if offered).
3. Wait until the project is ready. Keep the database password in a password manager; it is not needed in the frontend env file.

### B2 — Create the table and security policies

1. In the project dashboard, open **SQL Editor → New query**.
2. Open this repository's `supabase/schema.sql`, copy all its contents, paste in the editor, and click **Run**.
3. Confirm `public.user_workspace` exists under **Table Editor**. RLS must be enabled. The policies are deliberately user-scoped.
4. The SQL also creates a private `prep-evidence` storage bucket and scoped policies. The current UI only accepts evidence links; the bucket is reserved for a later upload feature.

### B3 — Configure authentication and keys

1. Open **Project Settings → API** (sometimes labeled API Keys).
2. Copy the **Project URL** and the **publishable key** (or legacy `anon` key). Never use `service_role` or a secret key in a browser app.
3. In the project, open **Authentication → URL Configuration**. For local development set Site URL to `http://localhost:3000`; add that URL to Redirect URLs if needed.
4. Optional: under **Authentication → Providers → Email**, decide whether email confirmation is enabled. If enabled, sign-up users must confirm their email before signing in.
5. In the app directory, copy `.env.example` to `.env.local` and populate:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```
6. Restart `npm run dev` after editing env values. Sign up from the app's login screen, then sign in.

### B4 — Verify cloud persistence

1. Sign in; complete a roadmap item or save a daily session.
2. In Supabase **Table Editor → user_workspace**, verify a row appears for your auth user.
3. Sign out and sign back in, or open the deployed app on another device; the tracker should load the same cloud data.
4. In the browser, export a JSON backup periodically. Cloud sync is not a substitute for backups.

## C. Deploy frontend to GitHub + Vercel (free for personal use)

### C1 — Push to GitHub

1. Create a **private** repository on https://github.com/new (e.g. `google-sde-prep-tracker`). Do not initialize with a README if this folder already has one.
2. From this project folder run:
   ```bash
   git init
   git add .
   git commit -m "Initial SWE Prep OS full-stack app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/google-sde-prep-tracker.git
   git push -u origin main
   ```
3. Check `.env.local` is not tracked. It is ignored by `.gitignore`; never commit API secrets. The public/publishable Supabase key is designed for browser use, but database RLS is mandatory.

### C2 — Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project** and import your private repository.
3. Framework should be detected as Next.js. Build command `npm run build`; output settings can stay default.
4. In **Environment Variables**, add both values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   Select Production, Preview, and Development if desired.
5. Click **Deploy**. Vercel will provide a URL such as `https://google-sde-prep-tracker.vercel.app`.
6. In Supabase **Authentication → URL Configuration**, set Site URL to your Vercel URL and add it to Redirect URLs. Keep `http://localhost:3000` too for local work.
7. Redeploy in Vercel if you changed environment variables or auth URLs. Open the live URL and sign up/sign in.

### C3 — Automatic future deployments

Commit and push changes to `main`; Vercel automatically builds and deploys. Preview deployments are generated for branches/pull requests.

## D. Updating the app

```bash
# edit files
npm run build              # catch TypeScript/build errors
 git add .
 git commit -m "Describe your change"
 git push
```

Vercel deploys the pushed commit. For schema changes, make a new SQL migration/query in Supabase and keep it in `supabase/` in Git.

## Troubleshooting

- **App says local mode / no login:** check `.env.local` names and values, restart dev server, or check Vercel env vars and redeploy.
- **Invalid login / email confirmation:** check Supabase Auth provider settings and email confirmation inbox.
- **Table permission / RLS error:** rerun/inspect `supabase/schema.sql`; do not disable RLS or expose a service-role key.
- **Changes don't sync:** verify sign-in, browser network console, Supabase row, and project URL/key. Wait about a second after editing.
- **Vercel build fails:** run `npm run build` locally and inspect the first TypeScript/build error.
- **Lost local history:** use the sidebar's Export backup. Import/restore is not currently implemented; preserve backups before clearing browser data.

## Free-tier caveats

Free plans and quotas can change. Supabase free projects may pause after inactivity and have limits; Vercel Hobby is for personal/non-commercial use. This is a single-user portfolio/preparation tool, not a production multi-tenant SaaS. Check provider pricing/terms before expanding usage.

## Data model (MVP)

`user_workspace(user_id UUID PK → auth.users, payload JSONB, updated_at)` stores the state blob (sessions, problems, roadmap completion, notes) per account. This intentionally keeps the starter simple and private. A later normalized schema can split sessions, problems, attempts, reviews, and attachments into dedicated tables once analytics/filters demand it.
