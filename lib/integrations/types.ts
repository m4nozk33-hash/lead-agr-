export type ImportedCompany = { name:string; cnpj?:string; segment?:string; city?:string; uf?:string; phone?:string; site?:string; instagram?:string; source:string };
export interface CompanyProvider { name:string; fetchNew(): Promise<ImportedCompany[]> }
// Registre aqui os provedores reais (Receita Federal, Google Places...). Cada um implementa CompanyProvider.
export const providers: CompanyProvider[] = [];
