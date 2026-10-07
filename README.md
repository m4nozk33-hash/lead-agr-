# AGR LeadHunter
CRM de prospecção B2B. Next.js 14 (App Router) + PostgreSQL (Neon) + Vercel.

## Publicar
1. Suba este projeto no GitHub.
2. Na Vercel: **Add New → Project** e importe o repositório. Em **Storage**, adicione um banco **Neon Postgres** (preenche `DATABASE_URL`).
3. Em **Environment Variables**, defina `APP_PASSWORD`, `AUTH_SECRET` e `CRON_SECRET` (veja `.env.example`).
4. Crie as tabelas uma vez, com `DATABASE_URL` em `.env.local`: `npm install && npm run db:init`.
5. Faça o deploy. Acesse o site e entre com `APP_PASSWORD`.

## Local
`cp .env.example .env.local`, preencha, rode `npm run db:init` e `npm run dev`.

## Integrações
Implemente `CompanyProvider` em `lib/integrations/types.ts` (Receita Federal, Google Places...) e registre em `providers`. A rotina `vercel.json` chama `/api/cron/daily` todo dia às 09:00 UTC e insere empresas novas sem duplicar CNPJ.
