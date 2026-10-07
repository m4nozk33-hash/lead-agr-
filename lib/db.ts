import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`create table if not exists leads(
        id serial primary key,
        name text not null,
        cnpj text,
        segment text,
        city text,
        uf text,
        phone text,
        site text,
        instagram text,
        complete boolean not null default false,
        source text not null default 'manual',
        stage text not null default 'Novo Lead',
        created_at timestamptz not null default now()
      )`;
      await sql`create unique index if not exists leads_cnpj_uq on leads(cnpj) where cnpj is not null`;
      await sql`create table if not exists activities(
        id serial primary key,
        lead_id int not null references leads(id) on delete cascade,
        kind text not null,
        type text,
        outcome text,
        body text,
        created_at timestamptz not null default now()
      )`;
      await sql`create index if not exists activities_lead_idx on activities(lead_id, created_at desc)`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
