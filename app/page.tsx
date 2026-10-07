'use client';
import { useCallback, useEffect, useState } from 'react';
import { STAGES, score, Lead } from '../lib/score';

const api = async (u: string, o?: RequestInit) => {
  const r = await fetch(u, { headers: { 'Content-Type': 'application/json' }, ...o });
  if (r.status === 401) { location.href = '/login'; throw new Error('401'); }
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Erro');
  return j;
};
const sc = (n: number) => (n >= 80 ? 's1' : n >= 60 ? 's2' : n >= 40 ? 's3' : 's4');
const Badge = ({ c }: { c: Lead }) => { const s = score(c).s; return <span className={`sc ${sc(s)}`}>{s}</span>; };
const NF = <span className="nf">Não informado</span>;
const dt = (x: string) => new Date(x).toLocaleString('pt-BR');
const Bars = ({ data, n }: { data: [string, number][]; n: number }) => <>{data.length ? data.map(([k, v]) => <div className="bar" key={k}><em>{k}</em><i style={{ width: `${Math.max(3, (v / n) * 200)}%`, maxWidth: '70%' }} />{v}</div>) : <span className="nf">Sem dados ainda.</span>}</>;
const count = (L: Lead[], f: (l: Lead) => string | null): [string, number][] => { const m: Record<string, number> = {}; L.forEach(l => { const k = f(l); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };

export default function App() {
  const [route, setRoute] = useState('#/');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api('/api/leads').then(setLeads).catch(e => setErr(e.message)), []);
  useEffect(() => { load(); const h = () => { setRoute(location.hash || '#/'); window.scrollTo(0, 0); }; h(); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, [load]);
  const nav = [['#/', 'Dashboard'], ['#/empresas', 'Empresas'], ['#/pipeline', 'Pipeline'], ['#/integracoes', 'Integrações']];
  const active = route.startsWith('#/lead') ? '#/empresas' : route;
  const move = async (id: number, stage: string) => { await api(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ stage }) }); load(); };
  return <div className="app">
    <aside><div className="logo">AGR <b>LeadHunter</b><small>Marketing e Tecnologia</small></div>
      {nav.map(([h, t]) => <a key={h} href={h} className={active === h ? 'on' : ''}>{t}</a>)}</aside>
    <main>{err && <p className="err">Não foi possível carregar os dados: {err}. Verifique DATABASE_URL e execute npm run db:init.</p>}
      {!leads && !err ? <p className="nf">Carregando…</p> : leads && (
        route.startsWith('#/lead/') ? <LeadPage id={route.split('/')[2]} reload={load} move={move} /> :
        route === '#/empresas' ? <Companies leads={leads} reload={load} /> :
        route === '#/pipeline' ? <Pipeline leads={leads} move={move} /> :
        route === '#/integracoes' ? <Integrations /> : <Dashboard leads={leads} />)}</main></div>;
}

function Dashboard({ leads }: { leads: Lead[] }) {
  const n = leads.length, d7 = Date.now() - 7 * 864e5;
  const novos = leads.filter(l => l.stage === 'Novo Lead').length, ct = leads.reduce((a, l) => a + (l.contacts || 0), 0);
  const op = leads.filter(l => ['Qualificado', 'Primeiro Contato', 'Em negociação'].includes(l.stage)).length;
  const top = [...leads].sort((a, b) => score(b).s - score(a).s).slice(0, 5);
  if (!n) return <><h1>Dashboard</h1><div className="card"><h2>Nenhuma empresa cadastrada</h2><p>Cadastre a primeira empresa para começar a acompanhar seus leads.</p><a href="#/empresas"><button className="pri">Cadastrar empresa</button></a></div></>;
  return <><h1>Dashboard</h1>
    <div className="grid k4">{[[n, 'Total de leads'], [novos, 'Leads novos'], [ct, 'Contatos realizados'], [op, 'Oportunidades abertas']].map(([v, t]) => <div className="card kpi" key={t as string}><b>{v}</b><span>{t} </span></div>)}</div>
    <div className="grid k2" style={{ marginTop: 14 }}>
      <div className="card"><h2>Leads por etapa</h2><Bars n={n} data={STAGES.map(s => [s, leads.filter(l => l.stage === s).length] as [string, number])} /></div>
      <div className="card"><h2>Leads por segmento</h2><Bars n={n} data={count(leads, l => l.segment)} /></div>
      <div className="card"><h2>Leads por cidade</h2><Bars n={n} data={count(leads, l => l.city)} /></div>
      <div className="card"><h2>Maiores scores</h2>{top.map(c => <div className="bar" key={c.id}><a href={`#/lead/${c.id}`} style={{ flex: 1 }}>{c.name}</a><Badge c={c} /></div>)}
        <p className="nf" style={{ fontSize: 12 }}>{leads.filter(l => new Date(l.created_at).getTime() > d7).length} cadastrados nos últimos 7 dias</p></div></div></>;
}

function Companies({ leads, reload }: { leads: Lead[]; reload: () => void }) {
  const [f, setF] = useState({ q: '', uf: '', city: '', seg: '', opp: '' });
  const [open, setOpen] = useState(false), [form, setForm] = useState<any>({}), [msg, setMsg] = useState('');
  const u = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const opts = (fn: (l: Lead) => string | null) => [...new Set(leads.map(fn).filter(Boolean) as string[])].sort();
  const rows = leads.filter(c => (!f.q || c.name.toLowerCase().includes(f.q.toLowerCase())) && (!f.uf || c.uf === f.uf) && (!f.city || c.city === f.city) && (!f.seg || c.segment === f.seg) &&
    (!f.opp || (f.opp === 'nosite' && !c.site) || (f.opp === 'fraca' && [c.site, c.instagram].filter(Boolean).length <= 1) || (f.opp === 'inc' && !c.complete))).sort((a, b) => score(b).s - score(a).s);
  const save = async (e: React.FormEvent) => { e.preventDefault(); setMsg(''); try { await api('/api/leads', { method: 'POST', body: JSON.stringify(form) }); setForm({}); setOpen(false); reload(); } catch (x: any) { setMsg(x.message); } };
  const fld = (k: string, ph: string, req = false) => <input placeholder={ph} required={req} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} />;
  return <><h1>Empresas</h1>
    <div className="filters"><button className="pri" onClick={() => setOpen(!open)}>{open ? 'Fechar' : 'Cadastrar empresa'}</button></div>
    {open && <form className="card filters" onSubmit={save} style={{ marginBottom: 14 }}>{fld('name', 'Nome da empresa *', true)}{fld('cnpj', 'CNPJ')}{fld('segment', 'Segmento')}{fld('city', 'Cidade')}{fld('uf', 'UF')}{fld('phone', 'Telefone')}{fld('site', 'Site')}{fld('instagram', 'Instagram')}
      <label><input type="checkbox" checked={!!form.complete} onChange={e => setForm({ ...form, complete: e.target.checked })} /> Perfil comercial completo</label><button className="pri">Salvar empresa</button>{msg && <span className="err">{msg}</span>}</form>}
    <div className="filters"><input placeholder="Buscar por nome" value={f.q} onChange={u('q')} />
      <select value={f.uf} onChange={u('uf')}><option value="">Estado</option>{opts(l => l.uf).map(v => <option key={v}>{v}</option>)}</select>
      <select value={f.city} onChange={u('city')}><option value="">Cidade</option>{opts(l => l.city).map(v => <option key={v}>{v}</option>)}</select>
      <select value={f.seg} onChange={u('seg')}><option value="">Segmento</option>{opts(l => l.segment).map(v => <option key={v}>{v}</option>)}</select>
      <select value={f.opp} onChange={u('opp')}><option value="">Todas as oportunidades</option><option value="nosite">Sem site</option><option value="fraca">Pouca presença digital</option><option value="inc">Perfil incompleto</option></select></div>
    <div className="card tw"><table><thead><tr><th>Score</th><th>Empresa</th><th>CNPJ</th><th>Segmento</th><th>Cidade</th><th>Telefone</th><th>Site</th><th>Instagram</th><th>Origem</th></tr></thead><tbody>
      {rows.length ? rows.map(c => <tr key={c.id} className="r" onClick={() => (location.hash = `#/lead/${c.id}`)}><td><Badge c={c} /></td><td><b>{c.name}</b></td><td>{c.cnpj || NF}</td><td>{c.segment || NF}</td><td>{c.city ? `${c.city}${c.uf ? '/' + c.uf : ''}` : NF}</td><td>{c.phone || NF}</td><td>{c.site || NF}</td><td>{c.instagram || NF}</td><td>{c.source === 'manual' ? 'Cadastro manual' : c.source}</td></tr>)
        : <tr><td colSpan={9}>{leads.length ? 'Nenhuma empresa com esses filtros. Remova um filtro para ver mais resultados.' : 'Nenhuma empresa cadastrada. Use "Cadastrar empresa" para começar.'}</td></tr>}</tbody></table></div></>;
}

function LeadPage({ id, reload, move }: { id: string; reload: () => void; move: (id: number, s: string) => Promise<void> }) {
  const [d, setD] = useState<any>(null), [note, setNote] = useState(''), [ct, setCt] = useState({ type: 'Ligação', outcome: 'Sem resposta', body: '' }), [e, setE] = useState('');
  const get = useCallback(() => api(`/api/leads/${id}`).then(setD).catch(x => setE(x.message)), [id]);
  useEffect(() => { get(); }, [get]);
  if (e) return <><a href="#/empresas">← Empresas</a><h1>Lead não encontrado</h1></>;
  if (!d) return <p className="nf">Carregando…</p>;
  const c: Lead = d.lead, s = score(c), acts: any[] = d.activities;
  const post = async (b: any) => { await api(`/api/leads/${c.id}/activity`, { method: 'POST', body: JSON.stringify(b) }); await get(); reload(); };
  const del = async () => { if (confirm(`Excluir "${c.name}" e todo o histórico? Esta ação não pode ser desfeita.`)) { await api(`/api/leads/${c.id}`, { method: 'DELETE' }); await reload(); location.hash = '#/empresas'; } };
  const Tl = ({ items }: { items: any[] }) => <div className="tl">{items.length ? items.map(a => <div key={a.id}>{a.kind === 'contact' && <b>{a.type} · {a.outcome}<br /></b>}{a.body}<small>{dt(a.created_at)}</small></div>) : <span className="nf">Nada registrado ainda.</span>}</div>;
  return <><a href="#/empresas">← Empresas</a><h1 style={{ marginTop: 6 }}>{c.name} <Badge c={c} /></h1>
    <div className="grid k2">
      <div className="card"><h2>Informações</h2><dl className="dl"><dt>CNPJ</dt><dd>{c.cnpj || NF}</dd><dt>Segmento</dt><dd>{c.segment || NF}</dd><dt>Cidade/UF</dt><dd>{c.city ? `${c.city}${c.uf ? '/' + c.uf : ''}` : NF}</dd><dt>Telefone</dt><dd>{c.phone || NF}</dd><dt>Site</dt><dd>{c.site || NF}</dd><dt>Instagram</dt><dd>{c.instagram || NF}</dd><dt>Perfil comercial</dt><dd>{c.complete ? 'Completo' : 'Incompleto'}</dd><dt>Origem</dt><dd>{c.source === 'manual' ? 'Cadastro manual' : c.source}</dd><dt>Cadastrado em</dt><dd>{dt(c.created_at)}</dd></dl>
        <button className="dng" style={{ marginTop: 12 }} onClick={del}>Excluir empresa</button></div>
      <div className="card"><h2>Por que este lead é interessante?</h2>{s.w.map(([m, p]) => <div key={m}>+{p} · {m}</div>)}
        <h2 style={{ marginTop: 14 }}>Etapa do pipeline</h2><select value={c.stage} onChange={async x => { await move(c.id, x.target.value); get(); }}>{STAGES.map(x => <option key={x}>{x}</option>)}</select></div>
      <div className="card"><h2>Registrar contato</h2><div className="filters"><select value={ct.type} onChange={x => setCt({ ...ct, type: x.target.value })}>{['Ligação', 'WhatsApp', 'E-mail', 'Reunião'].map(x => <option key={x}>{x}</option>)}</select>
        <select value={ct.outcome} onChange={x => setCt({ ...ct, outcome: x.target.value })}>{['Sem resposta', 'Respondeu', 'Interessado', 'Sem interesse'].map(x => <option key={x}>{x}</option>)}</select></div>
        <textarea rows={2} style={{ width: '100%' }} placeholder="Resumo do contato" value={ct.body} onChange={x => setCt({ ...ct, body: x.target.value })} />
        <button className="pri" style={{ marginTop: 8 }} onClick={async () => { await post({ kind: 'contact', ...ct }); setCt({ ...ct, body: '' }); }}>Registrar contato</button><Tl items={acts.filter(a => a.kind === 'contact')} /></div>
      <div className="card"><h2>Observações</h2><textarea rows={2} style={{ width: '100%' }} placeholder="Escreva uma observação" value={note} onChange={x => setNote(x.target.value)} />
        <button className="pri" style={{ marginTop: 8 }} onClick={async () => { if (note.trim()) { await post({ kind: 'note', body: note }); setNote(''); } }}>Salvar observação</button><Tl items={acts.filter(a => a.kind === 'note')} />
        <h2 style={{ marginTop: 14 }}>Histórico de etapas</h2><Tl items={acts.filter(a => a.kind === 'stage')} /></div></div></>;
}

function Pipeline({ leads, move }: { leads: Lead[]; move: (id: number, s: string) => Promise<void> }) {
  return <><h1>Pipeline</h1><div className="cols">{STAGES.map(s => { const a = leads.filter(c => c.stage === s); return <div className="col" key={s}><h3>{s}<span>{a.length}</span></h3>
    {a.map(c => <div className="pc" key={c.id}><a href={`#/lead/${c.id}`}><b>{c.name}</b></a> <Badge c={c} /><div style={{ color: 'var(--mu)' }}>{c.city || 'Cidade não informada'}</div>
      <select value={s} onChange={e => move(c.id, e.target.value)}>{STAGES.map(x => <option key={x}>{x}</option>)}</select></div>)}</div>; })}</div></>;
}

function Integrations() {
  const a = [['Receita Federal (CNPJ)', 'Importação de empresas novas e sócios'], ['Google Places', 'Telefone, site e endereço comerciais'], ['WhatsApp', 'Verificação e envio de mensagens'], ['IA', 'Resumo do lead e sugestão de abordagem']];
  return <><h1>Integrações</h1><p style={{ color: 'var(--mu)' }}>Nenhuma integração conectada. Cada fonte entra como um provedor em <code>lib/integrations/types.ts</code> e é executada pela rotina diária (<code>/api/cron/daily</code>).</p>
    {a.map(([t, d]) => <div className="card" key={t} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><div><b>{t}</b><div style={{ color: 'var(--mu)', fontSize: 13 }}>{d}</div></div><span className="chip">Não conectado</span></div>)}</>;
}
