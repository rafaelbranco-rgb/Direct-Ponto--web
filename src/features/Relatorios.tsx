import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CATEGORIAS, STATUS_UI } from '../data/catalog';
import { colaboradorPorId } from '../data/mock';
import type { CategoriaCodigo, Chamado, StatusChamado } from '../data/types';
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
const COR_CAT = 'var(--c-gold)';
const COR_SETOR = 'var(--c-brand-soft)';

export function Relatorios({ chamados }: { chamados: Chamado[] }) {
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

    const porCategoria = new Map<CategoriaCodigo, number>();
    for (const c of base) porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + 1);
    const categorias = [...porCategoria.entries()]
      .map(([cod, n]) => ({ cod, n, label: CATEGORIAS[cod].label }))
      .sort((a, b) => b.n - a.n);

    const status = (Object.keys(STATUS_UI) as StatusChamado[])
      .map((s) => ({ s, n: conta(s), label: STATUS_UI[s].label, cor: STATUS_UI[s].dot }))
      .filter((x) => x.n > 0);

    const porAtendente = new Map<string, number>();
    for (const c of base) if (c.atendente) porAtendente.set(c.atendente, (porAtendente.get(c.atendente) ?? 0) + 1);
    const atendentes = [...porAtendente.entries()].map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n);

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
  const maxAtend = Math.max(1, ...dados.atendentes.map((a) => a.n));

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
        <div className="mx-auto max-w-[1000px]">
          {vazio ? (
            <div className="mt-24 flex flex-col items-center gap-2 text-ink-dim">
              <Inbox size={40} />
              <span className="text-sm">Nenhum chamado no período selecionado.</span>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Kpi i={0} icon={MessageSquare} cor="#4b7be0" label="Total de chamados" valor={dados.total} />
                <Kpi i={1} icon={Clock} cor="#e6a92e" label="Em aberto" valor={dados.emAberto} />
                <Kpi i={2} icon={CheckCircle2} cor="#2bb673" label="Aprovados" valor={dados.aprovados} />
                <Kpi i={3} icon={ThumbsUp} cor="#7c5cff" label="Taxa de aprovação" valor={dados.taxa} sufixoValor="%" rodape={`${dados.resolvidos} resolvido(s)`} />
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {/* Donut — status */}
                <Painel titulo="Distribuição por status" delay={60}>
                  <div className="flex items-center gap-4">
                    <div className="relative h-[200px] w-[200px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dados.status}
                            dataKey="n"
                            nameKey="label"
                            innerRadius={58}
                            outerRadius={92}
                            paddingAngle={2}
                            stroke="none"
                            animationDuration={900}
                            animationEasing="ease-out">
                            {dados.status.map((s) => (
                              <Cell key={s.s} fill={s.cor} />
                            ))}
                          </Pie>
                          <Tooltip content={<DicaGrafico />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-ink">{dados.total}</span>
                        <span className="text-[11px] text-ink-dim">chamados</span>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      {dados.status.map((s) => (
                        <div key={s.s} className="flex items-center gap-2 text-sm">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.cor }} />
                          <span className="min-w-0 flex-1 truncate text-ink-dim">{s.label}</span>
                          <span className="font-bold text-ink">{s.n}</span>
                          <span className="w-10 text-right text-xs text-ink-dim">
                            {Math.round((s.n / dados.total) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Painel>

                {/* Barras horizontais — tipo de ocorrência */}
                <Painel titulo="Por tipo de ocorrência" delay={120}>
                  <div style={{ height: Math.max(180, dados.categorias.length * 40) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dados.categorias} layout="vertical" margin={{ left: 6, right: 28, top: 4, bottom: 4 }}>
                        <CartesianGrid horizontal={false} stroke="var(--c-line)" strokeDasharray="3 3" />
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={130}
                          tick={{ fill: 'var(--c-ink-dim)', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip cursor={{ fill: 'var(--c-surface2)', opacity: 0.35 }} content={<DicaGrafico />} />
                        <Bar dataKey="n" fill={COR_CAT} radius={[0, 6, 6, 0]} barSize={18} animationDuration={900} animationEasing="ease-out">
                          <LabelList dataKey="n" position="right" fill="var(--c-ink-dim)" fontSize={12} fontWeight={700} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Painel>

                {/* Barras verticais — setor */}
                <Painel titulo="Por setor" delay={180}>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dados.setores} margin={{ left: -16, right: 8, top: 8, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke="var(--c-line)" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="setor"
                          tick={{ fill: 'var(--c-ink-dim)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                        />
                        <YAxis allowDecimals={false} tick={{ fill: 'var(--c-ink-dim)', fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                        <Tooltip cursor={{ fill: 'var(--c-surface2)', opacity: 0.35 }} content={<DicaGrafico chave="setor" />} />
                        <Bar dataKey="n" fill={COR_SETOR} radius={[6, 6, 0, 0]} barSize={36} animationDuration={900} animationEasing="ease-out">
                          <LabelList dataKey="n" position="top" fill="var(--c-ink-dim)" fontSize={12} fontWeight={700} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Painel>

                {/* Ranking — atendente */}
                <Painel titulo="Por atendente" delay={240}>
                  {dados.atendentes.length === 0 ? (
                    <p className="py-8 text-center text-sm text-ink-dim">Nenhum atendimento atribuído.</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {dados.atendentes.map((a, i) => (
                        <div key={a.nome} className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand-soft">
                            {iniciais(a.nome)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                              <span className="truncate font-semibold text-ink">{a.nome}</span>
                              <span className="shrink-0 font-bold text-ink-dim">{a.n}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                              <div
                                className="h-full rounded-full bg-brand"
                                style={{
                                  width: `${(a.n / maxAtend) * 100}%`,
                                  animation: 'crescer-barra 0.9s cubic-bezier(0.2,0.84,0.2,1) both',
                                  animationDelay: `${260 + i * 70}ms`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Painel>
              </div>

              <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-dim">
                <XCircle size={13} /> {dados.recusados} recusado(s) no período
              </p>
            </>
          )}
        </div>
      </div>

      {/* keyframe da barra do ranking (não depende de bibliotecas) */}
      <style>{`@keyframes crescer-barra { from { width: 0 } }`}</style>
    </section>
  );
}

/** Tooltip dos gráficos no tema do app. */
function DicaGrafico({ active, payload, chave }: { active?: boolean; payload?: any[]; chave?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const titulo = p.payload?.[chave ?? 'label'] ?? p.name;
  return (
    <div className="glass-strong rounded-lg border border-line px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-ink">{titulo}</div>
      <div className="text-ink-dim">{p.value} chamado(s)</div>
    </div>
  );
}

function useContagem(alvo: number, dur = 700) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const inicio = performance.now();
    const de = ref.current;
    let raf = 0;
    const passo = (agora: number) => {
      const p = Math.min(1, (agora - inicio) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const atual = de + (alvo - de) * e;
      setV(atual);
      ref.current = atual;
      if (p < 1) raf = requestAnimationFrame(passo);
      else ref.current = alvo;
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, dur]);
  return Math.round(v);
}

function Kpi({
  i,
  icon: Icon,
  cor,
  label,
  valor,
  sufixoValor,
  rodape,
}: {
  i: number;
  icon: LucideIcon;
  cor: string;
  label: string;
  valor: number;
  sufixoValor?: string;
  rodape?: string;
}) {
  const n = useContagem(valor);
  return (
    <div className="glass animate-fade-up rounded-2xl border border-line p-4" style={{ animationDelay: `${i * 60}ms` }}>
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${cor}22`, color: cor }}>
          <Icon size={18} />
        </span>
        <span className="text-xs font-semibold text-ink-dim">{label}</span>
      </div>
      <div className="mt-2 text-3xl font-extrabold text-ink">
        {n}
        {sufixoValor}
      </div>
      {rodape && <div className="text-[11px] text-ink-dim">{rodape}</div>}
    </div>
  );
}

function Painel({ titulo, children, delay = 0 }: { titulo: string; children: React.ReactNode; delay?: number }) {
  return (
    <div className="glass animate-fade-up rounded-2xl border border-line p-4" style={{ animationDelay: `${delay}ms` }}>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">{titulo}</h2>
      {children}
    </div>
  );
}
