import { NextResponse } from 'next/server';

type BrasilApiCnpj = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal_descricao?: string;
  descricao_situacao_cadastral?: string;
  municipio?: string;
  uf?: string;
  ddd_telefone_1?: string;
  email?: string | null;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
};

const normalizarCnpj = (valor: string) =>
  valor.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

export async function GET(
  _req: Request,
  { params }: { params: { cnpj: string } }
) {
  const cnpj = normalizarCnpj(params.cnpj);

  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(cnpj)) {
    return NextResponse.json(
      { error: 'CNPJ inválido. Informe 14 caracteres.' },
      { status: 400 }
    );
  }

  try {
    const resposta = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${encodeURIComponent(cnpj)}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 86400 },
      }
    );

    if (resposta.status === 404) {
      return NextResponse.json(
        { error: 'CNPJ não encontrado.' },
        { status: 404 }
      );
    }

    if (resposta.status === 400) {
      return NextResponse.json(
        { error: 'CNPJ inválido ou mal formatado.' },
        { status: 400 }
      );
    }

    if (resposta.status === 429) {
      return NextResponse.json(
        { error: 'Limite temporário de consultas atingido. Tente novamente em instantes.' },
        { status: 503 }
      );
    }

    if (!resposta.ok) {
      return NextResponse.json(
        { error: 'Serviço de consulta de CNPJ indisponível no momento.' },
        { status: 502 }
      );
    }

    const dados = (await resposta.json()) as BrasilApiCnpj;

    return NextResponse.json({
      cnpj: dados.cnpj || cnpj,
      name: dados.nome_fantasia?.trim() || dados.razao_social?.trim() || '',
      razaoSocial: dados.razao_social || '',
      nomeFantasia: dados.nome_fantasia || '',
      segment: dados.cnae_fiscal_descricao || '',
      situacao: dados.descricao_situacao_cadastral || '',
      city: dados.municipio || '',
      uf: dados.uf || '',
      phone: dados.ddd_telefone_1 || '',
      email: dados.email || '',
      cep: dados.cep || '',
      logradouro: dados.logradouro || '',
      numero: dados.numero || '',
      complemento: dados.complemento || '',
      bairro: dados.bairro || '',
    });
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível consultar o CNPJ agora.' },
      { status: 502 }
    );
  }
}
