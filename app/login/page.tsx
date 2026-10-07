'use client';
import { useState } from 'react';
export default function Login() {
  const [p, setP] = useState(''), [e, setE] = useState('');
  async function go(ev: React.FormEvent) {
    ev.preventDefault();
    const r = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ password: p }) });
    if (r.ok) location.href = '/'; else setE('Senha incorreta');
  }
  return <main style={{ maxWidth: 340, margin: '15vh auto' }}><div className="logo" style={{ color: 'var(--tx)' }}>AGR <b>LeadHunter</b></div>
    <form className="card" onSubmit={go}><input type="password" placeholder="Senha de acesso" value={p} onChange={x => setP(x.target.value)} style={{ width: '100%' }} />
      {e && <p style={{ color: 'var(--rd)' }}>{e}</p>}<button className="pri" style={{ marginTop: 10, width: '100%' }}>Entrar</button></form></main>;
}
