import { useMemo, useState } from 'react';
import { BarChart3, History, MessageSquare, Search, Inbox } from 'lucide-react';

import { ConversaPane } from '../features/ConversaPane';
import { Historico } from '../features/Historico';
import { NavRail, type Aba } from '../features/NavRail';
import { Settings } from '../features/Settings';
import { CATEGORIAS, statusCor } from '../data/catalog';
import { CHAMADOS, colaboradorPorId } from '../data/mock';
import type { Chamado } from '../data/types';
import { useAuth } from '../context/auth';
import { useTema } from '../context/theme';
import { diaMes, horaAgora, iniciais, tempoEspera } from '../lib/format';

/** Grupo do atendimento (fixo neste módulo, espelha o Nexti). */
const GRUPO = 'Justificativas · Ponto';

function ultima(c: Chamado) {
  return c.mensagens[c.mensagens.length - 1];
}

export function Console() {
  const { gestor } = useAuth();
  const { esquema } = useTema();
  const [aba, setAba] = useState<Aba>('atendimentos');
  const [chamados, setChamados] = useState<Chamado[]>(CHAMADOS);
  const [selId, setSelId] = useState<string | null>(CHAMADOS.find((c) => c.status === 'PENDENTE')?.id ?? null);
  const [busca, setBusca] = useState('');
  const [verEncerrados, setVerEncerrados] = useState(false);
  const [colabFiltro, setColabFiltro] = useState<string | null>(null);

  const selecionado = chamados.find((c) => c.id === selId) ?? null;

  const { emAtendimento, emEspera, encerrados } = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const passa = (c: Chamado) => {
      if (colabFiltro && c.colaboradorId !== colabFiltro) return false;
      if (!termo) return true;
      const nome = colaboradorPorId(c.colaboradorId)?.nome.toLowerCase() ?? '';
      return nome.includes(termo) || CATEGORIAS[c.categoria].label.toLowerCase().includes(termo);
    };
    const filtrados = chamados.filter(passa);
    return {
      emAtendimento: filtrados
        .filter((c) => c.status === 'EM_ATENDIMENTO')
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
      // Em espera: mais antigos (espera mais longa) primeiro, como no Nexti.
      emEspera: filtrados
        .filter((c) => c.status === 'PENDENTE')
        .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)),
      encerrados: filtrados
        .filter((c) => c.status === 'APROVADO' || c.status === 'RECUSADO')
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    };
  }, [chamados, busca, colabFiltro]);

  function atualizar(id: string, fn: (c: Chamado) => Chamado) {
    setChamados((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }

  /** Puxa um chamado em espera para atendimento e abre a conversa. */
  function atender(c: Chamado) {
    const nome = gestor?.nome ?? 'Gestor';
    atualizar(c.id, (ch) => ({
      ...ch,
      status: 'EM_ATENDIMENTO',
      atendente: ch.atendente ?? nome,
      mensagens: [
        ...ch.mensagens,
        {
          id: `s-${Date.now()}`,
          autor: 'SISTEMA',
          texto: `Protocolo ${ch.protocolo} — Atendimento iniciado por ${nome}`,
          data: `Hoje às ${horaAgora()}h`,
        },
      ],
    }));
    setSelId(c.id);
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

  function transferir(atendente: string) {
    if (!selecionado) return;
    const anterior = selecionado.atendente;
    const txt = anterior
      ? `Protocolo ${selecionado.protocolo} — Atendimento transferido de ${anterior} para ${atendente}`
      : `Protocolo ${selecionado.protocolo} — Atendimento atribuído a ${atendente}`;
    atualizar(selecionado.id, (c) => ({
      ...c,
      status: c.status === 'PENDENTE' ? 'EM_ATENDIMENTO' : c.status,
      atendente,
      mensagens: [...c.mensagens, { id: `t-${Date.now()}`, autor: 'SISTEMA', texto: txt, data: `Hoje às ${horaAgora()}h` }],
    }));
  }

  const totalDoColaborador = selecionado
    ? chamados.filter((c) => c.colaboradorId === selecionado.colaboradorId).length
    : 0;

  if (aba !== 'atendimentos') {
    return (
      <div className="flex h-full">
        <NavRail aba={aba} onAba={setAba} />
        {aba === 'config' ? (
          <Settings />
        ) : aba === 'historico' ? (
          <Historico chamados={chamados} />
        ) : (
          <EmBreve aba={aba} />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Aba lateral (opções/botões) */}
      <NavRail aba={aba} onAba={setAba} />

      <div key="atendimentos" className="flex min-h-0 flex-1 animate-fade-in">
        {/* Lista de chamados — seções estilo Nexti Direct */}
        <aside className="glass flex w-[360px] shrink-0 flex-col border-r border-line">
          {/* Cabeçalho: Em atendimento (N) · Encerrados */}
          <div className="flex items-center justify-between border-b border-line px-4 pb-2.5 pt-3">
            <h2 className="text-[15px] font-bold text-ink">
              {verEncerrados ? 'Encerrados' : 'Em atendimento'}{' '}
              <span className="text-ink-dim">({verEncerrados ? encerrados.length : emAtendimento.length})</span>
            </h2>
            <button
              onClick={() => setVerEncerrados((v) => !v)}
              className={`text-xs font-semibold transition hover:underline ${
                verEncerrados ? 'text-brand-soft' : 'text-ink-dim'
              }`}>
              {verEncerrados ? '← Em atendimento' : 'Encerrados'}
            </button>
          </div>

          {/* Busca */}
          <div className="px-3 pt-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2">
              <Search size={17} className="text-ink-dim" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/70"
              />
            </div>
            {colabFiltro && (
              <button
                onClick={() => setColabFiltro(null)}
                className="mt-2 text-xs font-semibold text-brand-soft hover:underline">
                ← Ver todos (limpar histórico de {colaboradorPorId(colabFiltro)?.nome.split(' ')[0]})
              </button>
            )}
          </div>

          <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
            {verEncerrados ? (
              /* ——— Encerrados ——— */
              encerrados.length === 0 ? (
                <Vazio texto="Nenhum atendimento encerrado." />
              ) : (
                encerrados.map((c) => (
                  <CardAtendimento
                    key={c.id}
                    c={c}
                    ativo={c.id === selId}
                    esquema={esquema}
                    onClick={() => setSelId(c.id)}
                  />
                ))
              )
            ) : (
              <>
                {/* ——— Em atendimento ——— */}
                {emAtendimento.length === 0 ? (
                  <Vazio texto="Nenhum atendimento em andamento." />
                ) : (
                  emAtendimento.map((c) => (
                    <CardAtendimento
                      key={c.id}
                      c={c}
                      ativo={c.id === selId}
                      esquema={esquema}
                      onClick={() => setSelId(c.id)}
                    />
                  ))
                )}

                {/* ——— Em espera ——— */}
                <div className="sticky top-0 z-10 border-y border-line bg-surface/80 px-4 py-2 text-sm font-bold text-ink backdrop-blur">
                  Em espera <span className="text-ink-dim">({emEspera.length})</span>
                </div>
                {emEspera.length === 0 ? (
                  <Vazio texto="Ninguém aguardando atendimento." />
                ) : (
                  emEspera.map((c) => {
                    const colab = colaboradorPorId(c.colaboradorId);
                    const cat = CATEGORIAS[c.categoria];
                    return (
                      <div
                        key={c.id}
                        className={`flex items-start justify-between gap-2 border-b border-line/60 px-4 py-3 transition ${
                          c.id === selId ? 'bg-surface-2' : 'hover:bg-surface/60'
                        }`}>
                        <button onClick={() => setSelId(c.id)} className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-semibold text-ink">{colab?.nome}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-dim">
                            <cat.icon size={13} className="shrink-0 text-gold" />
                            <span className="truncate">Assunto: {cat.label}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-ink-dim">{tempoEspera(c.criadoEm)}</div>
                        </button>
                        <button
                          onClick={() => atender(c)}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-gold transition hover:bg-gold/10">
                          Atender
                        </button>
                      </div>
                    );
                  })
                )}
              </>
            )}
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
            onTransferir={transferir}
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

/** Card de chamado em atendimento/encerrado (com avatar), estilo Nexti. */
function CardAtendimento({
  c,
  ativo,
  esquema,
  onClick,
}: {
  c: Chamado;
  ativo: boolean;
  esquema: 'light' | 'dark';
  onClick: () => void;
}) {
  const colab = colaboradorPorId(c.colaboradorId);
  const cat = CATEGORIAS[c.categoria];
  const st = statusCor(c.status, esquema);
  const u = ultima(c);
  const preview = u?.texto || (u?.anexo ? 'Anexo enviado' : u?.data) || '';
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-left transition ${
        ativo ? 'bg-surface-2' : 'hover:bg-surface/60'
      }`}>
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand/20 text-sm font-bold text-brand-soft">
        {iniciais(colab?.nome ?? '?')}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-navy"
          style={{ background: st.dot }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">{colab?.nome}</span>
          <span className="shrink-0 text-[11px] text-ink-dim">{diaMes(c.criadoEm)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-dim">
          <cat.icon size={13} className="shrink-0 text-gold" />
          <span className="truncate">{GRUPO} · {cat.label}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-ink-dim">
          Protocolo: {c.protocolo} — {preview}
        </div>
      </div>
    </button>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-ink-dim">
      <Inbox size={30} />
      <span className="text-sm">{texto}</span>
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
    <div className="flex flex-1 animate-fade-up flex-col items-center justify-center gap-3 text-ink-dim">
      <Icon size={48} className="text-brand-soft" />
      <h2 className="text-xl font-bold text-ink">{titulo}</h2>
      <p className="max-w-sm text-center text-sm">{txt}</p>
    </div>
  );
}
