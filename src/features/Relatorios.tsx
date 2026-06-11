import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Inbox,
  MessageSquare,
  Printer,
  ThumbsUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { CATEGORIAS, STATUS_UI } from '../data/catalog';
import { colaboradorPorId } from '../data/mock';
import type { CategoriaCodigo, Chamado, StatusChamado } from '../data/types';
import { useTema } from '../context/theme';
import { exportarChamadosCSV, exportarRelatorioPDF } from '../lib/export';
import { iniciais } from '../lib/format';

type Periodo = 7 | 30 | 90 | 0;
const PERIODOS: { dias: Periodo; label: string }[] = [
  { dias: 7, label: '7 dias' },
  { dias: 30, label: '30 dias' },
  { dias: 90, label: '90 dias' },
  { dias: 0, label: 'Tudo' },
];

const ABERTO: StatusChamado[] = ['PENDENTE', 'EM_ATENDIMENTO'];

export function Relatorios({ chamados }: { chamados: Chamado[] }) {
  const { esquema } = useTema();
  const [periodo, setPeriodo] = useState<Periodo>(0);

  const dados = useMemo(() => {
    const corte = periodo ? Date.now() - periodo * 86_400_000 : 0;
    const base = corte ? chamados.filter((c) => new Date(c.criadoEm).getTime() >= corte) : chamados;

    const total = base.length;
    const conta = (s: StatusChamado) => base.filter((c) => c.status === s).length;
    const aprovados = conta('APROVADO');
    const recusados = conta('RECUSADO');
    const resolvidos = aprovados + recusados;
    const emAberto = base.filter((c) => ABERTO.includes(c.status)).length;
    const taxa = resolvidos ? Math.round((aprovados / resolvidos) * 100) : 0;

    // Por tipo de ocorrência
    const porCategoria = new Map<CategoriaCodigo, number>();
    for (const c of base) porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + 1);
    const categorias = [...porCategoria.entries()]
      .map(([cod, n]) => ({ cod, n, label: CATEGORIAS[cod].label, icon: CATEGORIAS[cod].icon }))
      .sort((a, b) => b.n - a.n);

    // Por status
    const status = (Object.keys(STATUS_UI) as StatusChamado[]).map((s) => ({
      s,
      n: conta(s),
      label: STATUS_UI[s].label,
      cor: STATUS_UI[s].dot,
    }));

    // Por atendente
    const porAtendente = new Map<string, number>();
    for (const c of base) if (c.atendente) porAtendente.set(c.atendente, (porAtendente.get(c.atendente) ?? 0) + 1);
    const atendentes = [...porAtendente.entries()]
      .map(([nome, n]) => ({ nome, n }))
      .sort((a, b) => b.n - a.n);

    // Por setor
    const porSetor = new Map<string, number>();
    for (const c of base) {
      const setor = colaboradorPorId(c.colaboradorId)?.setor ?? '—';
      porSetor.set(setor, (porSetor.get(setor) ?? 0) + 1);
    }
    const setores = [...porSetor.entries()].map(([setor, n]) => ({ setor, n })).sort((a, b) => b.n - a.n);

    return { base, total, aprovados, recusados, resolvidos, emAberto, taxa, categorias, status, atendentes, setores };
  }, [chamados, periodo]);

  const vazio = dados.total === 0;
  const periodoLabel = PERIODOS.find((p) => p.dias === periodo)!.label;
  const sufixo = periodo ? `${periodo}d` : 'tudo';

  function exportarCSV() {
    exportarChamadosCSV(dados.base, sufixo);
  }

  function exportarPDF() {
    exportarRelatorioPDF({
      periodoLabel,
      kpis: [
        { label: 'Total de chamados', valor: dados.total },
        { label: 'Em aberto', valor: dados.emAberto },
        { label: 'Aprovados', valor: dados.aprovados },
        { label: 'Taxa de aprovação', valor: `${dados.taxa}%` },
      ],
      secoes: [
        { titulo: 'Por tipo de ocorrência', itens: dados.categorias.map((c) => ({ label: c.label, n: c.n })) },
        { titulo: 'Por status', itens: dados.status.map((s) => ({ label: s.label, n: s.n })) },
        { titulo: 'Por atendente', itens: dados.atendentes.map((a) => ({ label: a.nome, n: a.n })) },
        { titulo: 'Por setor', itens: dados.setores.map((s) => ({ label: s.setor, n: s.n })) },
      ],
    });
  }

  return (
    <section className="flex min-h-0 flex-1 animate-fade-in flex-col">
      {/* Cabeçalho */}
      <header className="glass-strong flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Relatórios</h1>
          <p className="text-xs text-ink-dim">Visão geral das justificativas de ponto</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-line bg-surface/60 p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                onClick={() => setPeriodo(p.dias)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  periodo === p.dias ? 'bg-brand text-white' : 'text-ink-dim hover:bg-surface-2'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportarCSV}
            disabled={vazio}
            title="Exportar CSV"
            className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink-dim transition hover:bg-surface-2 disabled:opacity-40">
            <Download size={15} /> CSV
          </button>
          <button
            onClick={exportarPDF}
            disabled={vazio}
            title="Exportar PDF / Imprimir"
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40">
            <Printer size={15} /> PDF
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-[980px]">
          {vazio ? (
            <div className="mt-24 flex flex-col items-center gap-2 text-ink-dim">
              <Inbox size={40} />
              <span className="text-sm">Nenhum chamado no período selecionado.</span>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Kpi icon={MessageSquare} cor="#4b7be0" label="Total de chamados" valor={dados.total} />
                <Kpi icon={Clock} cor="#e6a92e" label="Em aberto" valor={dados.emAberto} />
                <Kpi icon={CheckCircle2} cor="#2bb673" label="Aprovados" valor={dados.aprovados} />
                <Kpi
                  icon={ThumbsUp}
                  cor="#7c5cff"
                  label="Taxa de aprovação"
                  valor={`${dados.taxa}%`}
                  rodape={`${dados.resolvidos} resolvido(s)`}
                />
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {/* Por tipo de ocorrência */}
                <Painel titulo="Por tipo de ocorrência">
                  <div className="flex flex-col gap-3">
                    {dados.categorias.map((c) => (
                      <Barra
                        key={c.cod}
                        icone={c.icon}
                        label={c.label}
                        n={c.n}
                        max={dados.categorias[0].n}
                        cor="#d9a73a"
                      />
                    ))}
                  </div>
                </Painel>

                {/* Por status */}
                <Painel titulo="Por status">
                  <div className="flex flex-col gap-3">
                    {dados.status.map((s) => (
                      <Barra key={s.s} label={s.label} n={s.n} max={dados.total} cor={s.cor} ponto />
                    ))}
                  </div>
                </Painel>

                {/* Por atendente */}
                <Painel titulo="Por atendente">
                  {dados.atendentes.length === 0 ? (
                    <p className="py-4 text-center text-sm text-ink-dim">Nenhum atendimento atribuído.</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {dados.atendentes.map((a) => (
                        <div key={a.nome} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface/60">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand-soft">
                            {iniciais(a.nome)}
                          </div>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{a.nome}</span>
                          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-bold text-ink-dim">
                            {a.n}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Painel>

                {/* Por setor */}
                <Painel titulo="Por setor">
                  <div className="flex flex-col gap-3">
                    {dados.setores.map((s) => (
                      <Barra key={s.setor} label={s.setor} n={s.n} max={dados.setores[0].n} cor="#4b7be0" />
                    ))}
                  </div>
                </Painel>
              </div>

              <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-dim">
                <XCircle size={13} /> {dados.recusados} recusado(s) no período · dados de demonstração
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Kpi({
  icon: Icon,
  cor,
  label,
  valor,
  rodape,
}: {
  icon: LucideIcon;
  cor: string;
  label: string;
  valor: number | string;
  rodape?: string;
}) {
  return (
    <div className="glass rounded-2xl border border-line p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${cor}22`, color: cor }}>
          <Icon size={18} />
        </span>
        <span className="text-xs font-semibold text-ink-dim">{label}</span>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-ink">{valor}</div>
      {rodape && <div className="text-[11px] text-ink-dim">{rodape}</div>}
    </div>
  );
}

function Painel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-line p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">{titulo}</h2>
      {children}
    </div>
  );
}

function Barra({
  icone: Icone,
  label,
  n,
  max,
  cor,
  ponto,
}: {
  icone?: LucideIcon;
  label: string;
  n: number;
  max: number;
  cor: string;
  ponto?: boolean;
}) {
  const pct = max > 0 ? Math.round((n / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 text-ink">
          {Icone && <Icone size={14} className="shrink-0 text-gold" />}
          {ponto && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cor }} />}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 font-bold text-ink-dim">{n}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cor }} />
      </div>
    </div>
  );
}
