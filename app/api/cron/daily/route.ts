import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';
import { providers } from '../../../../lib/integrations/types';
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  let inserted = 0;
  for (const p of providers) for (const c of await p.fetchNew()) {
    const r = await sql`insert into leads(name,cnpj,segment,city,uf,phone,site,instagram,source) values(${c.name},${c.cnpj ?? null},${c.segment ?? null},${c.city ?? null},${c.uf ?? null},${c.phone ?? null},${c.site ?? null},${c.instagram ?? null},${c.source}) on conflict do nothing returning id`;
    inserted += r.length;
  }
  return NextResponse.json({ providers: providers.length, inserted });
}
