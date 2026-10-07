import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';
const t = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : null);
export async function GET() {
  const rows = await sql`select l.*, (select count(*) from activities a where a.lead_id=l.id and a.kind='contact')::int as contacts from leads l order by l.created_at desc`;
  return NextResponse.json(rows);
}
export async function POST(req: Request) {
  const b = await req.json();
  if (!t(b.name)) return NextResponse.json({ error: 'Informe o nome da empresa' }, { status: 400 });
  try {
    const [l] = await sql`insert into leads(name,cnpj,segment,city,uf,phone,site,instagram,complete) values(${t(b.name)},${t(b.cnpj)},${t(b.segment)},${t(b.city)},${t(b.uf)?.toUpperCase() ?? null},${t(b.phone)},${t(b.site)},${t(b.instagram)},${!!b.complete}) returning *`;
    await sql`insert into activities(lead_id,kind,body) values(${l.id},'stage','Lead cadastrado')`;
    return NextResponse.json(l);
  } catch { return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 409 }); }
}
