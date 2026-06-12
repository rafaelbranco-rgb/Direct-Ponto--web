import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  MessageSquare,
  Search,
  UserSearch,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { MensagemBolha } from './MensagemBolha';
import { CATEGORIAS, statusCor } from '../data/catalog';
import { colaboradorPorId } from '../data/mock';
import type { Chamado, StatusChamado } from '../data/types';
import { useTema } from '../context/theme';
import { dataBR, diaMes, iniciais } from '../lib/format';

const RESULTADO: Record<StatusChamado, { txt: string; icon: LucideIcon; cls: string }> = {
  APROVADO: { txt: 'Justificativa aceita', icon: CheckCircle2, cls: 'text-[#1f9e63] bg-[rgba(43,182,115,0.12)]' },
  RECUSADO: { txt: 'Justificativa recusada', icon: XCircle, cls: 'text-[#d9483b] bg-[rgba(224,87,77,0.12)]' },
  PENDENTE: { txt: 'Aguardando análise', icon: Clock, cls: 'text-[#b07d16] bg-[rgba(230,169,46,0.14)]' },
  EM_ATENDIMENTO: { txt: 'Em atendimento', icon: MessageSquare, cls: 'text-[#2e5fbf] bg-[rgba(75,123,224,0.14)]' },
};

export function Historico({ chamados }: { chamados: Chamado[] }) {
  const { esquema } = useTema();
  const [busca, setBusca] = useState('');
  const [colabSel, setColabSel] = useState<string | null>(null);
  const [protSel, setProtSel] = useState<string | null>(null);

  const porColaborador = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of chamados) map.set(c.colaboradorId, (map.get(c.colaboradorId) ?? 0) + 1);
    return map;
  }, [chamados]);

  const colaboradores = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const termoNum = termo.replace(/\D/g, '');
    // Monta a lista a partir dos CHAMADOS reais (resolve o colaborador registrado),
    // não do array mock — assim funciona com os IDs vindos do backend.
    const lista = Array.from(porColaborador.keys())
      .flatMap((id) => {
        const c = colaboradorPorId(id);
        return c ? [c] : [];
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
    if (!termo) return lista;
    return lista.filter((c) => {
      const cpfNum = (c.cpf ?? '').replace(/\D/g, '');
      return (
        c.nome.toLowerCase().includes(termo) ||
        (c.matricula ?? '').toLowerCase().includes(termo) ||
        (termoNum.length > 0 && cpfNum.includes(termoNum))
      );
    });
  }, [busca, porColaborador]);

  const protocolos = useMemo(
    () =>
      chamados
        .filter((c) => c.colaboradorId === colabSel)
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    [chamados, colabSel],
  );

  const protocolo = protocolos.find((p) => p.id === protSel) ?? null;
  const colaborador = colabSel ? colaboradorPorId(colabSel) : null;

  return (
    <div className="flex min-h-0 flex-1 animate-fade-in">
      {/* Coluna: busca de colaborador → protocolos */}
      <aside className="glass flex w-[360px] shrink-0 flex-col border-r border-line">
        {!colabSel ? (
          <>
            <div className="p-3">
              <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-ink-dim">Histórico por colaborador</h2>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2">
                <Search size={17} className="text-ink-dim" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, matrícula ou CPF"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/70"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {colaboradores.length === 0 && (
                <div className="mt-16 flex flex-col items-center gap-2 text-ink-dim">
                  <UserSearch size={34} />
                  <span className="text-sm">Nenhum colaborador encontrado.</span>
                </div>
              )}
              {colaboradores.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setColabSel(c.id);
                    setProtSel(null);
                  }}
                  className="flex w-full items-center gap-3 border-b border-line/60 px-3 py-3 text-left transition hover:bg-surface/60">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/20 text-sm font-bold text-brand-soft">
                    {iniciais(c.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{c.nome}</div>
                    <div className="text-xs text-ink-dim">{c.setor} · mat. {c.matricula}</div>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-dim">
                    {porColaborador.get(c.id)}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-line p-3">
              <button
                onClick={() => {
                  setColabSel(null);
                  setProtSel(null);
                }}
                className="mb-2 flex items-center gap-1 text-xs font-semibold text-brand-soft hover:underline">
                <ChevronLeft size={15} /> Colaboradores
              </button>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-brand/20 text-sm font-bold text-brand-soft">
                  {iniciais(colaborador?.nome ?? '?')}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{colaborador?.nome}</div>
                  <div className="text-xs text-ink-dim">{colaborador?.setor} · {protocolos.length} protocolo(s)</div>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {protocolos.map((p) => {
                const cat = CATEGORIAS[p.categoria];
                const st = statusCor(p.status, esquema);
                const ativo = p.id === protSel;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProtSel(p.id)}
                    className={`mb-1.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      ativo ? 'bg-surface-2' : 'hover:bg-surface/60'
                    }`}>
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-soft">
                      <cat.icon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{cat.label}</div>
                      <div className="text-xs text-ink-dim">#{p.protocolo} · {diaMes(p.criadoEm)}</div>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: st.bg, color: st.fg }}>
                      {st.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* Detalhe do protocolo */}
      {protocolo ? (
        <DetalheProtocolo key={protocolo.id} chamado={protocolo} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ink-dim">
          <FileText size={46} className="text-brand-soft" />
          <p className="max-w-xs text-center text-sm">
            {colabSel
              ? 'Selecione um protocolo para ver o histórico de mensagens e o resultado.'
              : 'Busque um colaborador para ver o histórico de justificativas dele.'}
          </p>
        </div>
      )}
    </div>
  );
}

function DetalheProtocolo({ chamado }: { chamado: Chamado }) {
  const cat = CATEGORIAS[chamado.categoria];
  const res = RESULTADO[chamado.status];
  const Icone = res.icon;

  return (
    <section className="flex min-w-0 flex-1 animate-fade-in flex-col">
      <header className="glass-strong border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <cat.icon size={18} className="text-gold" />
          <h2 className="text-[15px] font-bold text-ink">{cat.label}</h2>
          <span className="text-xs text-ink-dim">· Protocolo {chamado.protocolo}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-dim">
          <span>Ocorrência: {dataBR(chamado.dataOcorrencia)}</span>
          {(chamado.horarioOriginal || chamado.horarioProposto) && (
            <span>Horário: {chamado.horarioOriginal ?? '—'} → {chamado.horarioProposto ?? '—'}</span>
          )}
          {chamado.atendente && <span>Atendente: {chamado.atendente}</span>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto max-w-[820px]">
          {/* Resultado */}
          <div className={`mb-4 flex items-start gap-2 rounded-xl px-4 py-3 ${res.cls}`}>
            <Icone size={20} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-bold">{res.txt}</div>
              {chamado.status === 'RECUSADO' && chamado.motivoRecusa && (
                <div className="text-sm opacity-90">Motivo: {chamado.motivoRecusa}</div>
              )}
              {chamado.descricao && (
                <div className="mt-1 text-sm text-ink-dim">Justificativa: {chamado.descricao}</div>
              )}
            </div>
          </div>

          {/* Histórico de mensagens */}
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-dim">Histórico de mensagens</h3>
          <div className="flex flex-col gap-2">
            {chamado.mensagens.map((m, i) => (
              <MensagemBolha key={m.id} m={m} anterior={chamado.mensagens[i - 1]} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
