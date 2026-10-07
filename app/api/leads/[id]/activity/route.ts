import { NextResponse } from 'next/server';
import { sql } from '../../../../../lib/db';
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id), b = await req.json();
  if (!['note', 'contact'].includes(b.kind)) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  const body = String(b.body || '').trim();
  if (b.kind === 'note' && !body) return NextResponse.json({ error: 'Escreva a observação' }, { status: 400 });
  await sql`insert into activities(lead_id,kind,type,outcome,body) values(${id},${b.kind},${b.type ?? null},${b.outcome ?? null},${body})`;
  if (b.kind === 'contact') {
    const [l] = await sql`update leads set stage='Primeiro Contato' where id=${id} and stage in ('Novo Lead','Qualificado') returning id`;
    if (l) await sql`insert into activities(lead_id,kind,body) values(${id},'stage','Etapa movida para Primeiro Contato')`;
  }
  return NextResponse.json({ ok: true });
}
