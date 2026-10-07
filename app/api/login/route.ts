import { NextResponse } from 'next/server';
import { token } from '../../../lib/auth';
export async function POST(req: Request) {
  const { password } = await req.json();
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  const r = NextResponse.json({ ok: true });
  r.cookies.set('agr', await token(), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60*60*24*30, path: '/' });
  return r;
}
