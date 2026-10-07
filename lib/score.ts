export const STAGES = ['Novo Lead','Qualificado','Primeiro Contato','Em negociação','Cliente','Perdido'];
export type Lead = { id:number; name:string; cnpj:string|null; segment:string|null; city:string|null; uf:string|null; phone:string|null; site:string|null; instagram:string|null; complete:boolean; source:string; stage:string; created_at:string; contacts?:number };
export function score(c: Lead) {
  let s = 10; const w: [string, number][] = [['Base', 10]];
  const a = (p: number, m: string) => { s += p; w.push([m, p]); };
  if (!c.site) a(30, 'Sem site'); if (!c.instagram) a(20, 'Sem Instagram');
  if (!c.complete) a(20, 'Perfil comercial incompleto'); if (c.phone) a(15, 'Telefone disponível'); if (c.cnpj) a(5, 'CNPJ identificado');
  return { s: Math.min(100, s), w };
}
