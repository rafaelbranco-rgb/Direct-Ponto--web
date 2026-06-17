import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageSquare, Search, Inbox } from 'lucide-react';

import { ConversaPane } from '../features/ConversaPane';
import { Historico } from '../features/Historico';
import { NavRail, type Aba } from '../features/NavRail';
import { Settings } from '../features/Settings';

// Relatórios usa Recharts (pesado) — carrega só quando a aba é aberta.
const Relatorios = lazy(() => import('../features/Relatorios').then((m) => ({ default: m.Relatorios })));
import { CATEGORIAS, statusCor } from '../data/catalog';
import { CHAMADOS, colaboradorPorId } from '../data/mock';
import type { Chamado } from '../data/types';
import { useAuth } from '../context/auth';
import { useTema } from '../context/theme';
import { api, apiAtiva, conectarSocket, desconectarSocket, type MensagemApi } from '../lib/api';
import { pedirPermissaoNotif, tratarNotificacao } from '../lib/notificacoes';
import { adaptarChamado, adaptarMensagem } from '../lib/adapters';
import { diaMes, horaAgora, iniciais, tempoEspera } from '../lib/format';

interface AtendenteOpcao {
  id: string;
  nome: string;
  setor: string;
}

/** Grupo do atendimento (fixo neste módulo, espelha o Nexti). */
const GRUPO = 'Justificativas · Ponto';

function ultima(c: Chamado) {
  return c.mensagens[c.mensagens.length - 1];
}

export function Console() {
  const { gestor } = useAuth();
  const { esquema } = useTema();
  const [aba, setAba] = useState<Aba>('atendimentos');
  const [chamados, setChamados] = useState<Chamado[]>(apiAtiva ? [] : CHAMADOS);
  // Histórico completo (todos os chamados) — igual para qualquer conta de atendente.
  const [historico, setHistorico] = useState<Chamado[]>(apiAtiva ? [] : CHAMADOS);
  const [selId, setSelId] = useState<string | null>(
    apiAtiva ? null : (CHAMADOS.find((c) => c.status === 'PENDENTE')?.id ?? null),
  );
  const [busca, setBusca] = useState('');
  const [verEncerrados, setVerEncerrados] = useState(false);
  const [colabFiltro, setColabFiltro] = useState<string | null>(null);
  const [atendentes, setAtendentes] = useState<AtendenteOpcao[] | undefined>(undefined);

  const selecionado = chamados.find((c) => c.id === selId) ?? null;
  const selIdRef = useRef<string | null>(selId);
  selIdRef.current = selId;
  const socketRef = useRef<ReturnType<typeof conectarSocket>>(null);

  // Só posso responder/decidir/transferir se o chamado é meu ou ainda está na
  // fila (sem dono). Chamado de outro atendente fica somente-leitura.
  const podeResponder =
    !!selecionado &&
    (selecionado.status === 'PENDENTE' ||
      !selecionado.atendenteId ||
      (gestor?.id ? selecionado.atendenteId === gestor.id : selecionado.atendente === gestor?.nome));

  // Cada conta vê apenas os chamados atribuídos a ela em "Em atendimento" e
  // "Encerrados" (todos os papéis funcionam igual; papel é só rótulo). Ao
  // transferir, o chamado sai da minha lista e entra na do destino.
  const meu = (c: Chamado) =>
    gestor?.id ? c.atendenteId === gestor.id : c.atendente === gestor?.nome;

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
      // Em atendimento: só os meus (atribuídos a mim).
      emAtendimento: filtrados
        .filter((c) => c.status === 'EM_ATENDIMENTO' && meu(c))
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
      // Em espera: fila compartilhada — todos veem e podem puxar. Mais antigos primeiro.
      emEspera: filtrados
        .filter((c) => c.status === 'PENDENTE')
        .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)),
      // Encerrados: só os meus (o histórico completo fica na aba Histórico).
      encerrados: filtrados
        .filter((c) => (c.status === 'APROVADO' || c.status === 'RECUSADO') && meu(c))
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chamados, busca, colabFiltro, gestor?.id, gestor?.nome]);

  function atualizar(id: string, fn: (c: Chamado) => Chamado) {
    setChamados((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }

  /** Anexa uma mensagem (do socket ou do envio) ao chamado, sem duplicar por id. */
  function receberMensagem(m: MensagemApi) {
    const msg = adaptarMensagem(m);
    const anexar = (lista: Chamado[]) =>
      lista.map((c) =>
        c.id === m.chamadoId && !c.mensagens.some((x) => x.id === msg.id)
          ? { ...c, mensagens: [...c.mensagens, msg] }
          : c,
      );
    setChamados((prev) => anexar(prev));
    setHistorico((prev) => anexar(prev));
  }

  // ——— Modo backend: carrega as filas e o detalhe de um chamado ———
  async function carregar() {
    try {
      const f = await api.listarChamados();
      const todos = [...f.emEspera, ...f.emAtendimento, ...f.encerrados].map(adaptarChamado);
      // A lista NÃO traz as mensagens (só o detalhe traz). Preserva as mensagens
      // já carregadas para não "apagar" a conversa aberta ao recarregar a fila.
      setChamados((prev) => {
        const msgsAnteriores = new Map(prev.map((c) => [c.id, c.mensagens]));
        return todos.map((c) =>
          c.mensagens.length ? c : { ...c, mensagens: msgsAnteriores.get(c.id) ?? c.mensagens },
        );
      });
    } catch {
      /* mantém o que já está na tela */
    }
  }
  async function abrirDetalhe(id: string) {
    try {
      const ad = adaptarChamado(await api.detalhe(id));
      setChamados((prev) => {
        const i = prev.findIndex((c) => c.id === id);
        if (i < 0) return [ad, ...prev];
        const cp = [...prev];
        cp[i] = ad;
        return cp;
      });
    } catch {
      /* ignora */
    }
  }

  // ——— Histórico: carrega TODOS os chamados (igual p/ todas as contas) ———
  async function carregarHistorico() {
    try {
      const lista = await api.listarHistorico();
      setHistorico((prev) => {
        const msgs = new Map(prev.map((c) => [c.id, c.mensagens]));
        // Preserva as mensagens já carregadas (a listagem não traz mensagens).
        return lista
          .map(adaptarChamado)
          .map((c) => (c.mensagens.length ? c : { ...c, mensagens: msgs.get(c.id) ?? c.mensagens }));
      });
    } catch {
      /* mantém o que já está na tela */
    }
  }
  async function abrirDetalheHistorico(id: string) {
    try {
      const ad = adaptarChamado(await api.detalhe(id));
      setHistorico((prev) => prev.map((c) => (c.id === id ? ad : c)));
    } catch {
      /* ignora */
    }
  }

  // Com backend ativo: carrega dados + atendentes e liga o tempo real.
  useEffect(() => {
    if (!apiAtiva) return;
    carregar();
    carregarHistorico();
    api
      .listarAtendentes()
      .then((lst) => setAtendentes(lst.map((a) => ({ id: a.id, nome: a.nome, setor: a.setor ?? '' }))))
      .catch(() => {});
    pedirPermissaoNotif();
    const s = conectarSocket();
    socketRef.current = s;
    if (s) {
      // Entra na sala do chamado já aberto (reconexão também).
      s.on('connect', () => {
        if (selIdRef.current) s.emit('entrar', selIdRef.current);
      });
      // Mensagem nova na conversa aberta: anexa na hora (sem recarregar tudo).
      s.on('mensagem:nova', (m: MensagemApi) => receberMensagem(m));
      // Mudança de fila/status (novo chamado, decisão, transferência): atualiza
      // as listas (as mensagens já chegam por 'mensagem:nova').
      const atualizarListas = () => {
        carregar();
        carregarHistorico();
      };
      s.on('chamado:novo', atualizarListas);
      s.on('chamado:atualizado', atualizarListas);
      s.on('notificacao', tratarNotificacao);
    }
    return () => desconectarSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Abre um chamado (carrega a conversa no backend; zera não lidas no demo). */
  function selecionar(id: string) {
    const anterior = selIdRef.current;
    setSelId(id);
    if (apiAtiva) {
      // Troca a sala do socket para receber as mensagens deste chamado na hora.
      const s = socketRef.current;
      if (s) {
        if (anterior && anterior !== id) s.emit('sair', anterior);
        s.emit('entrar', id);
      }
      abrirDetalhe(id);
    } else {
      atualizar(id, (c) => (c.naoLidas ? { ...c, naoLidas: 0 } : c));
    }
  }

  /** Puxa um chamado em espera para atendimento e abre a conversa. */
  async function atender(c: Chamado) {
    setSelId(c.id);
    if (apiAtiva) {
      try {
        await api.atender(c.id);
        await carregar();
        await abrirDetalhe(c.id);
      } catch {
        /* ignora */
      }
      return;
    }
    const nome = gestor?.nome ?? 'Gestor';
    atualizar(c.id, (ch) => ({
      ...ch,
      status: 'EM_ATENDIMENTO',
      atendente: ch.atendente ?? nome,
      naoLidas: 0,
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
  }

  async function enviar(texto: string) {
    if (!selecionado) return;
    if (apiAtiva) {
      const id = selecionado.id;
      try {
        // Mostra a mensagem na hora (com o id real do retorno → sem duplicar com
        // o eco do socket). A fila se atualiza pelo evento 'chamado:atualizado'.
        const m = await api.enviarMensagem(id, texto);
        receberMensagem(m);
      } catch {
        /* ignora */
      }
      return;
    }
    atualizar(selecionado.id, (c) => ({
      ...c,
      status: c.status === 'PENDENTE' ? 'EM_ATENDIMENTO' : c.status,
      atendente: c.atendente ?? `${gestor?.nome ?? 'Gestor'}`,
      mensagens: [...c.mensagens, { id: `g-${Date.now()}`, autor: 'ATENDENTE', texto, horario: horaAgora() }],
    }));
  }

  /** Envia um anexo (foto/documento) no chamado aberto e mostra na hora. */
  async function enviarAnexo(arquivo: File) {
    if (!selecionado || !apiAtiva) return;
    const id = selecionado.id;
    try {
      const m = await api.enviarAnexo(id, arquivo);
      receberMensagem(m);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível enviar o anexo.');
    }
  }

  async function decidir(decisao: 'APROVADO' | 'RECUSADO', motivo?: string) {
    if (!selecionado) return;
    if (apiAtiva) {
      try {
        await api.decidir(selecionado.id, decisao, motivo);
        await carregar();
        await abrirDetalhe(selecionado.id);
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Não foi possível registrar a decisão.');
      }
      return;
    }
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

  async function transferir(atendenteId: string, nome: string) {
    if (!selecionado) return;
    if (apiAtiva) {
      const id = selecionado.id;
      try {
        await api.transferir(id, atendenteId);
        // O chamado passa a ser do destino: sai da sala, fecha a conversa e some
        // da minha lista (recarregada). Não consigo mais responder por ele.
        socketRef.current?.emit('sair', id);
        if (selIdRef.current === id) setSelId(null);
        await carregar();
      } catch {
        /* ignora */
      }
      return;
    }
    const anterior = selecionado.atendente;
    const txt = anterior
      ? `Protocolo ${selecionado.protocolo} — Atendimento transferido de ${anterior} para ${nome}`
      : `Protocolo ${selecionado.protocolo} — Atendimento atribuído a ${nome}`;
    atualizar(selecionado.id, (c) => ({
      ...c,
      status: c.status === 'PENDENTE' ? 'EM_ATENDIMENTO' : c.status,
      atendente: nome,
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
          <Historico
            chamados={apiAtiva ? historico : chamados}
            onAbrirProtocolo={apiAtiva ? abrirDetalheHistorico : undefined}
          />
        ) : (
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center text-ink-dim">
                <Loader2 size={28} className="animate-spin" />
              </div>
            }>
            {/* Relatórios = visão GERAL (todos os chamados, igual p/ qualquer
                conta), por isso usa o histórico completo — não a fila pessoal. */}
            <Relatorios chamados={apiAtiva ? historico : chamados} />
          </Suspense>
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
            <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-ink">
              {verEncerrados ? 'Encerrados' : 'Em atendimento'}{' '}
              <span className="text-ink-dim">({verEncerrados ? encerrados.length : emAtendimento.length})</span>
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                meus
              </span>
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
                    onClick={() => selecionar(c.id)}
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
                      onClick={() => selecionar(c.id)}
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
                    const CatIcon = cat?.icon ?? MessageSquare;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-start justify-between gap-2 border-b border-line/60 px-4 py-3 transition ${
                          c.id === selId ? 'bg-surface-2' : 'hover:bg-surface/60'
                        }`}>
                        <button onClick={() => selecionar(c.id)} className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-ink">{colab?.nome ?? 'Colaborador'}</span>
                            {!!c.naoLidas && <Badge n={c.naoLidas} />}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-dim">
                            <CatIcon size={13} className="shrink-0 text-gold" />
                            <span className="truncate">Assunto: {cat?.label ?? c.categoria}</span>
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
            podeResponder={podeResponder}
            totalDoColaborador={totalDoColaborador}
            atendentes={atendentes}
            onEnviar={enviar}
            onEnviarAnexo={enviarAnexo}
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
  const CatIcon = cat?.icon ?? MessageSquare;
  const catLabel = cat?.label ?? c.categoria;
  const nomeColab = colab?.nome ?? 'Colaborador';
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
        {iniciais(nomeColab)}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-navy"
          style={{ background: st.dot }}
        />
        {!!c.naoLidas && (
          <span className="absolute -right-1.5 -top-1.5">
            <Badge n={c.naoLidas} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">{nomeColab}</span>
          <span className="shrink-0 text-[11px] text-ink-dim">{diaMes(c.criadoEm)}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-dim">
          <CatIcon size={13} className="shrink-0 text-gold" />
          <span className="truncate">{GRUPO} · {catLabel}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-ink-dim">
          Protocolo: {c.protocolo} — {preview}
        </div>
      </div>
    </button>
  );
}

/** Contador de mensagens não lidas (estilo Nexti, laranja). */
function Badge({ n }: { n: number }) {
  return (
    <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[11px] font-bold leading-none text-navy">
      {n > 9 ? '9+' : n}
    </span>
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

