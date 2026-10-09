'use client';

import { useEffect } from 'react';

type CnpjResult = {
  cnpj: string;
  name: string;
  segment: string;
  city: string;
  uf: string;
  phone: string;
};

const limparCnpj = (valor: string) =>
  valor.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

const formatarCnpj = (valor: string) => {
  const cnpj = limparCnpj(valor);
  if (cnpj.length !== 14) return valor;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
};

const formatarTelefone = (valor: string) => {
  const n = valor.replace(/\D/g, '');
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return valor;
};

function definirValor(input: HTMLInputElement | null, valor?: string) {
  if (!input || !valor || input.value.trim()) return;
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set;
  setter?.call(input, valor);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export default function CnpjAutofill() {
  useEffect(() => {
    let ultimoCnpj = '';
    let controller: AbortController | null = null;

    const consultar = async (input: HTMLInputElement) => {
      const cnpj = limparCnpj(input.value);
      input.setCustomValidity('');

      if (!cnpj) return;
      if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(cnpj)) {
        input.setCustomValidity('Informe um CNPJ válido com 14 caracteres.');
        input.reportValidity();
        return;
      }
      if (cnpj === ultimoCnpj) return;

      ultimoCnpj = cnpj;
      controller?.abort();
      controller = new AbortController();
      input.setAttribute('aria-busy', 'true');
      input.title = 'Consultando dados do CNPJ…';

      try {
        const resposta = await fetch(`/api/cnpj/${encodeURIComponent(cnpj)}`, {
          signal: controller.signal,
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
          if (resposta.status === 400 || resposta.status === 404) {
            input.setCustomValidity(dados.error || 'CNPJ não encontrado.');
            input.reportValidity();
          } else {
            input.title = dados.error || 'Consulta de CNPJ indisponível no momento.';
          }
          return;
        }

        const r = dados as CnpjResult;
        const form = input.form;
        if (!form) return;

        const campo = (placeholder: string) =>
          form.querySelector<HTMLInputElement>(`input[placeholder="${placeholder}"]`);

        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set;
        setter?.call(input, formatarCnpj(r.cnpj || cnpj));
        input.dispatchEvent(new Event('input', { bubbles: true }));

        definirValor(campo('Nome da empresa *'), r.name);
        definirValor(campo('Segmento'), r.segment);
        definirValor(campo('Cidade'), r.city);
        definirValor(campo('UF'), r.uf);
        definirValor(campo('Telefone'), formatarTelefone(r.phone));

        input.title = 'Dados preenchidos automaticamente pela consulta de CNPJ.';
      } catch (erro) {
        if ((erro as Error).name !== 'AbortError') {
          input.title = 'Não foi possível consultar o CNPJ agora.';
        }
      } finally {
        input.removeAttribute('aria-busy');
      }
    };

    const onBlur = (evento: FocusEvent) => {
      const input = evento.target;
      if (
        input instanceof HTMLInputElement &&
        input.placeholder === 'CNPJ'
      ) {
        void consultar(input);
      }
    };

    const onInput = (evento: Event) => {
      const input = evento.target;
      if (
        input instanceof HTMLInputElement &&
        input.placeholder === 'CNPJ'
      ) {
        input.setCustomValidity('');
        if (limparCnpj(input.value) !== ultimoCnpj) ultimoCnpj = '';
      }
    };

    document.addEventListener('blur', onBlur, true);
    document.addEventListener('input', onInput, true);

    return () => {
      controller?.abort();
      document.removeEventListener('blur', onBlur, true);
      document.removeEventListener('input', onInput, true);
    };
  }, []);

  return null;
}
