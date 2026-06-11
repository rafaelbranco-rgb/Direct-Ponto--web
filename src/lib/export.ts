import { CATEGORIAS, STATUS_UI } from '../data/catalog';
import { colaboradorPorId } from '../data/mock';
import type { Chamado } from '../data/types';
import { dataBR } from './format';

/** Dispara o download de um arquivo a partir de um texto. */
function baixar(conteudo: string, nome: string, mime: string) {
  const blob = new Blob(['﻿' + conteudo], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const aspas = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

/** Exporta a lista de chamados do período em CSV (separador ; para Excel BR). */
export function exportarChamadosCSV(chamados: Chamado[], sufixo: string) {
  const cab = ['Protocolo', 'Colaborador', 'Matrícula', 'Setor', 'Tipo', 'Status', 'Atendente', 'Ocorrência', 'Não lidas'];
  const linhas = chamados.map((c) => {
    const colab = colaboradorPorId(c.colaboradorId);
    return [
      c.protocolo,
      colab?.nome ?? '—',
      colab?.matricula ?? '—',
      colab?.setor ?? '—',
      CATEGORIAS[c.categoria].label,
      STATUS_UI[c.status].label,
      c.atendente ?? '—',
      dataBR(c.dataOcorrencia),
      String(c.naoLidas ?? 0),
    ].map(aspas).join(';');
  });
  const csv = [cab.map(aspas).join(';'), ...linhas].join('\r\n');
  baixar(csv, `relatorio-justificativas-${sufixo}.csv`, 'text/csv');
}

interface ResumoPDF {
  periodoLabel: string;
  kpis: { label: string; valor: string | number }[];
  secoes: { titulo: string; itens: { label: string; n: number }[] }[];
}

/** Abre uma janela com o relatório formatado e chama a impressão (Salvar como PDF). */
export function exportarRelatorioPDF({ periodoLabel, kpis, secoes }: ResumoPDF) {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) {
    alert('Permita pop-ups para exportar o PDF.');
    return;
  }
  const card = (k: { label: string; valor: string | number }) =>
    `<div class="kpi"><div class="kpi-l">${k.label}</div><div class="kpi-v">${k.valor}</div></div>`;
  const secao = (s: ResumoPDF['secoes'][number]) => {
    const max = Math.max(1, ...s.itens.map((i) => i.n));
    const rows = s.itens
      .map(
        (i) =>
          `<tr><td>${i.label}</td><td class="n">${i.n}</td><td class="bar"><span style="width:${Math.round(
            (i.n / max) * 100,
          )}%"></span></td></tr>`,
      )
      .join('');
    return `<h2>${s.titulo}</h2><table>${rows}</table>`;
  };

  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
    <title>Relatório de Justificativas</title>
    <style>
      *{box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}
      body{margin:32px;color:#1b2433}
      h1{font-size:22px;margin:0}
      .sub{color:#6b7686;font-size:13px;margin:2px 0 20px}
      .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
      .kpi{border:1px solid #e3e7ee;border-radius:12px;padding:14px}
      .kpi-l{font-size:12px;color:#6b7686;font-weight:600}
      .kpi-v{font-size:26px;font-weight:800;margin-top:6px}
      h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#6b7686;margin:22px 0 8px}
      table{width:100%;border-collapse:collapse}
      td{padding:6px 4px;font-size:13px;border-bottom:1px solid #eef1f5;vertical-align:middle}
      td.n{width:48px;text-align:right;font-weight:700}
      td.bar{width:45%}
      td.bar span{display:block;height:8px;border-radius:6px;background:#d9a73a}
      .foot{margin-top:28px;color:#9aa3b1;font-size:11px}
      @media print{body{margin:12mm}}
    </style></head><body>
    <h1>Relatório de Justificativas de Ponto</h1>
    <div class="sub">Período: ${periodoLabel} · Contato Atendimento</div>
    <div class="kpis">${kpis.map(card).join('')}</div>
    ${secoes.map(secao).join('')}
    <div class="foot">Gerado pelo Console Contato Atendimento.</div>
    </body></html>`);
  w.document.close();
  w.focus();
  // Aguarda o layout antes de imprimir.
  w.onload = () => w.print();
  setTimeout(() => w.print(), 400);
}
