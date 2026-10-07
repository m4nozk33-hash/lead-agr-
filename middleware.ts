import { NextRequest, NextResponse } from 'next/server';
import { token } from './lib/auth';
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p.startsWith('/login') || p.startsWith('/api/login') || p.startsWith('/api/cron')) return NextResponse.next();
  if (!process.env.APP_PASSWORD || req.cookies.get('agr')?.value !== (await token()))
    return p.startsWith('/api') ? NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) : NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };
