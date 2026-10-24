# Contract Change Assistant

A fictional demo prototype (university coursework) for "Demo Energy Ltd". It guides customer service users through metering point changes in existing energy sales contracts and tells them whether they can make the change themselves or need a super user. Guidance only — it uses only the sample data in `metering_point_changes.csv` and never stores customer or contract data.

Stack: Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui-style accordion, Lucide icons, Prisma + PostgreSQL, hosted on Railway.

## How it works

- `metering_point_changes.csv` — English knowledge base (`id, topic, question, answer, steps`; steps separated by `;`).
- `data/translations_et.json` — Estonian translations of the CSV content, keyed by `id`.
- `prisma/seed.mjs` — imports both into the `KnowledgeItem` table (upsert, safe to re-run).
- `GET /api/knowledge` — returns all knowledge items. `POST /api/usage` — stores an anonymous `UsageLog` (`language`, `action`, `outcome`) when a flow ends.
- UI texts and decision flows: `src/lib/i18n.ts` and `src/lib/flows.ts`.

## Deploy on Railway

1. Create a Railway project with a PostgreSQL database and a service from this GitHub repo.
2. In the app service's Variables, set `DATABASE_URL` to the database's URL (e.g. `${{Postgres.DATABASE_URL}}`). See `.env.example`.
3. Generate a public domain under the service's Settings → Networking.
4. Push to `main`. Railway runs `npm run build` (`prisma generate && next build`), then the pre-deploy command from `railway.json` (migrations + seed), then `npm run start` (`prisma migrate deploy && next start`, listening on `PORT`).

## Update the knowledge base

1. Edit `metering_point_changes.csv` (keep the header row). Add or update the matching Estonian entry in `data/translations_et.json` — rows without a translation fall back to English.
2. Run `npm.cmd run build` locally to check the build, then commit and push to `main`.
3. Railway redeploys and re-runs the seed automatically. To re-run the seed manually without a redeploy, run `npm run db:seed` from the service's shell in Railway (or `railway run npm run db:seed` with the Railway CLI).

Note: the seed updates and adds rows; it does not delete rows that were removed from the CSV.
