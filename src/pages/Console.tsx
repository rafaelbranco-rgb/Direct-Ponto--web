import { useMemo, useState } from 'react';
import { BarChart3, History, MessageSquare, Search, Inbox } from 'lucide-react';

import { ConversaPane } from '../features/ConversaPane';
import { NavRail, type Aba } from '../features/NavRail';
import { Settings } from '../features/Settings';
import { CATEGORIAS, STATUS_UI } from '../data/catalog';
import { CHAMADOS, colaboradorPorId } from '../data/mock';
import type { Chamado, StatusChamado } from '../data/types';
import { useAuth } from '../context/auth';
import { diaMes, horaAgora, iniciais } from '../lib/format';

type Filtro = 'TODOS' | 'PENDENTE' | 'EM_ATENDIMENTO' | 'RESOLVIDO';

const FILTROS: { chave: Filtro; label: string }[] = [
  { chave: 'TODOS', label: 'Todos' },
  { chave: 'PENDENTE', label: 'Pendentes' },
  { chave: 'EM_ATENDIMENTO', label: 'Em atendimento' },
  { chave: 'RESOLVIDO', label: 'Resolvidos' },
];

function casa(filtro: Filtro, s: StatusChamado) {
  if (filtro === 'TODOS') return true;
  if (filtro === 'RESOLVIDO') return s === 'APROVADO' || s === 'RECUSADO';
  return s === filtro;
}

function ultima(c: Chamado) {
  return c.mensagens[c.mensagens.length - 1];
}

export function Console() {
  const { gestor } = useAuth();
  const [aba, setAba] = useState<Aba>('atendimentos');
  const [config, setConfig] = useState(false);
  const [chamados, setChamados] = useState<Chamado[]>(CHAMADOS);
  const [selId, setSelId] = useState<string | null>(CHAMADOS.find((c) => c.status === 'PENDENTE')?.id ?? null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [colabFiltro, setColabFiltro] = useState<string | null>(null);

  const selecionado = chamados.find((c) => c.id === selId) ?? null;

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return chamados
      .filter((c) => casa(filtro, c.status))
      .filter((c) => !colabFiltro || c.colaboradorId === colabFiltro)
      .filter((c) => {
        if (!termo) return true;
        const nome = colaboradorPorId(c.colaboradorId)?.nome.toLowerCase() ?? '';
        return nome.includes(termo) || CATEGORIAS[c.categoria].label.toLowerCase().includes(termo);
      })
      .sort((a, b) => {
        const peso = (s: StatusChamado) => (s === 'PENDENTE' ? 0 : s === 'EM_ATENDIMENTO' ? 1 : 2);
        if (peso(a.status) !== peso(b.status)) return peso(a.status) - peso(b.status);
        return b.criadoEm.localeCompare(a.criadoEm);
      });
  }, [chamados, busca, filtro, colabFiltro]);

  function atualizar(id: string, fn: (c: Chamado) => Chamado) {
    setChamados((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }

  function enviar(texto: string) {
    if (!selecionado) return;
    atualizar(selecionado.id, (c) => ({
      ...c,
      status: c.status === 'PENDENTE' ? 'EM_ATENDIMENTO' : c.status,
      atendente: c.atendente ?? `${gestor?.nome ?? 'Gestor'}`,
      mensagens: [...c.mensagens, { id: `g-${Date.now()}`, autor: 'ATENDENTE', texto, horario: horaAgora() }],
    }));
  }

  function decidir(decisao: 'APROVADO' | 'RECUSADO', motivo?: string) {
    if (!selecionado) return;
    const txt =
      decisao === 'APROVADO'
        ? `Protocolo ${selecionado.protocolo} — Atendimento finalizado por ${gestor?.nome ?? 'Gestor'} (Aprovado)`
        : `Protocolo ${selecionado.protocolo} — Atendimento finalizado por ${gestor?.nome ?? 'Gestor'} (Recusado)`;
    atualizar(selecionado.id, (c) => ({
      ...c,
      status: decisao,
      atendente: gestor?.nome ?? 'Gestor',
      motivoRecusa: decisao === 'RECUSADO' ? motivo : undefined,
      mensagens: [...c.mensagens, { id: `s-${Date.now()}`, autor: 'SISTEMA', texto: txt, data: `Hoje às ${horaAgora()}h` }],
    }));
  }

  const totalDoColaborador = selecionado
    ? chamados.filter((c) => c.colaboradorId === selecionado.colaboradorId).length
    : 0;

  if (aba !== 'atendimentos') {
    return (
      <div className="flex h-full">
        <NavRail aba={aba} onAba={setAba} onConfig={() => setConfig(true)} />
        <EmBreve aba={aba} />
        <Settings aberto={config} onFechar={() => setConfig(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Aba lateral (opções/botões) */}
      <NavRail aba={aba} onAba={setAba} onConfig={() => setConfig(true)} />
      <Settings aberto={config} onFechar={() => setConfig(false)} />

      <div className="flex min-h-0 flex-1">
        {/* Lista de chamados */}
        <aside className="glass flex w-[360px] shrink-0 flex-col border-r border-line">
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2">
              <Search size={17} className="text-ink-dim" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar colaborador ou assunto"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/70"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FILTROS.map((f) => {
                const ativo = filtro === f.chave;
                return (
                  <button
                    key={f.chave}
                    onClick={() => setFiltro(f.chave)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      ativo ? 'bg-brand text-white' : 'border border-line text-ink-dim hover:bg-surface-2'
                    }`}>
                    {f.label}
                  </button>
                );
              })}
            </div>
            {colabFiltro && (
              <button
                onClick={() => setColabFiltro(null)}
                className="mt-2 text-xs font-semibold text-brand-soft hover:underline">
                ← Ver todos (limpar histórico de {colaboradorPorId(colabFiltro)?.nome.split(' ')[0]})
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {lista.length === 0 && (
              <div className="mt-16 flex flex-col items-center gap-2 text-ink-dim">
                <Inbox size={36} />
                <span className="text-sm">Nenhum chamado aqui.</span>
              </div>
            )}
            {lista.map((c) => {
              const colab = colaboradorPorId(c.colaboradorId);
              const cat = CATEGORIAS[c.categoria];
              const st = STATUS_UI[c.status];
              const u = ultima(c);
              const ativo = c.id === selId;
              const preview = u?.texto || (u?.anexo ? 'Anexo enviado' : u?.data) || '';
              return (
                <button
                  key={c.id}
                  onClick={() => setSelId(c.id)}
                  className={`flex w-full items-center gap-3 border-b border-line/60 px-3 py-3 text-left transition ${
                    ativo ? 'bg-surface-2' : 'hover:bg-surface/60'
                  }`}>
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand/20 text-sm font-bold text-brand-soft">
                    {iniciais(colab?.nome ?? '?')}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-navy" style={{ background: st.dot }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{colab?.nome}</span>
                      <span className="shrink-0 text-[11px] text-ink-dim">{diaMes(c.criadoEm)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ink-dim">
                      <cat.icon size={13} className="shrink-0 text-gold" />
                      <span className="truncate">{cat.label} · {preview}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Conversa */}
        {selecionado ? (
          <ConversaPane
            key={selecionado.id}
            chamado={selecionado}
            totalDoColaborador={totalDoColaborador}
            onEnviar={enviar}
            onDecidir={decidir}
            onVerHistorico={() => setColabFiltro(selecionado.colaboradorId)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ink-dim">
            <MessageSquare size={48} />
            <p>Selecione um chamado para começar o atendimento.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmBreve({ aba }: { aba: Aba }) {
  const info =
    aba === 'historico'
      ? { Icon: History, titulo: 'Histórico', txt: 'Histórico consolidado de solicitações por colaborador (em construção).' }
      : { Icon: BarChart3, titulo: 'Relatórios', txt: 'Relatórios por período, colaborador e tipo de ocorrência (em construção).' };
  const { Icon, titulo, txt } = info;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ink-dim">
      <Icon size={48} className="text-brand-soft" />
      <h2 className="text-xl font-bold text-ink">{titulo}</h2>
      <p className="max-w-sm text-center text-sm">{txt}</p>
    </div>
  );
}
