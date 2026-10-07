import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';
import { STAGES } from '../../../../lib/score';
type P = { params: { id: string } };
export async function GET(_: Request, { params }: P) {
  const id = Number(params.id);
  const [lead] = await sql`select * from leads where id=${id}`;
  if (!lead) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  const activities = await sql`select * from activities where lead_id=${id} order by created_at desc, id desc`;
  return NextResponse.json({ lead, activities });
}
export async function PATCH(req: Request, { params }: P) {
  const id = Number(params.id), { stage } = await req.json();
  if (!STAGES.includes(stage)) return NextResponse.json({ error: 'Etapa inválida' }, { status: 400 });
  const [old] = await sql`select stage from leads where id=${id}`;
  if (!old) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  if (old.stage !== stage) {
    await sql`update leads set stage=${stage} where id=${id}`;
    await sql`insert into activities(lead_id,kind,body) values(${id},'stage',${`Etapa: ${old.stage} → ${stage}`})`;
  }
  return NextResponse.json({ ok: true });
}
export async function DELETE(_: Request, { params }: P) {
  await sql`delete from leads where id=${Number(params.id)}`;
  return NextResponse.json({ ok: true });
}
