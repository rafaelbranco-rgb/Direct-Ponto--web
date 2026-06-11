import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, ThumbsDown, ThumbsUp, History, ArrowLeftRight, Search, Check } from 'lucide-react';

import { MensagemBolha } from './MensagemBolha';
import { CATEGORIAS, statusCor } from '../data/catalog';
import { ATENDENTES, colaboradorPorId } from '../data/mock';
import type { Chamado } from '../data/types';
import { useTema } from '../context/theme';
import { iniciais } from '../lib/format';

interface AtendenteOpcao {
  id: string;
  nome: string;
  setor: string;
}

interface Props {
  chamado: Chamado;
  totalDoColaborador: number;
  atendentes?: AtendenteOpcao[];
  onEnviar: (texto: string) => void;
  onDecidir: (decisao: 'APROVADO' | 'RECUSADO', motivo?: string) => void;
  onVerHistorico: () => void;
  onTransferir: (atendenteId: string, nome: string) => void;
}

export function ConversaPane({
  chamado,
  totalDoColaborador,
  atendentes,
  onEnviar,
  onDecidir,
  onVerHistorico,
  onTransferir,
}: Props) {
  const { esquema } = useTema();
  const colaborador = colaboradorPorId(chamado.colaboradorId);
  const cat = CATEGORIAS[chamado.categoria];
  const st = statusCor(chamado.status, esquema);
  const Icon = cat.icon;
  const resolvido = chamado.status === 'APROVADO' || chamado.status === 'RECUSADO';

  const [texto, setTexto] = useState('');
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [transferindo, setTransferindo] = useState(false);
  const [buscaAtendente, setBuscaAtendente] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);
  const transferRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chamado.id, chamado.mensagens.length]);

  // Fecha o painel de transferência ao clicar fora.
  useEffect(() => {
    if (!transferindo) return;
    function fora(e: MouseEvent) {
      if (transferRef.current && !transferRef.current.contains(e.target as Node)) {
        setTransferindo(false);
      }
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [transferindo]);

  // Reinicia o estado do painel ao trocar de chamado.
  useEffect(() => {
    setTransferindo(false);
    setBuscaAtendente('');
  }, [chamado.id]);

  const listaAtendentes = atendentes ?? ATENDENTES;
  const termoAtendente = buscaAtendente.trim().toLowerCase();
  const atendentesFiltrados = listaAtendentes.filter(
    (a) =>
      a.id !== chamado.atendenteId &&
      a.nome !== chamado.atendente &&
      a.nome.toLowerCase().includes(termoAtendente),
  );

  function transferir(a: AtendenteOpcao) {
    onTransferir(a.id, a.nome);
    setTransferindo(false);
    setBuscaAtendente('');
  }

  function enviar() {
    const t = texto.trim();
    if (!t) return;
    onEnviar(t);
    setTexto('');
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col animate-fade-in">
      {/* Cabeçalho da conversa */}
      <header className="glass-strong relative z-30 flex items-center gap-3 border-b border-line px-5 py-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-brand/20 text-sm font-bold text-brand-soft">
          {iniciais(colaborador?.nome ?? '?')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-bold text-ink">{colaborador?.nome}</h2>
            <span className="text-xs text-ink-dim">· {colaborador?.setor}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-dim">
            <Icon size={14} className="text-gold" />
            <span>{cat.label}</span>
            <span>· Protocolo {chamado.protocolo}</span>
          </div>
        </div>

        <button
          onClick={onVerHistorico}
          title="Ver histórico do colaborador"
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-dim transition hover:bg-surface-2">
          <History size={15} /> {totalDoColaborador} chamado{totalDoColaborador > 1 ? 's' : ''}
        </button>

        {/* Transferir chamado para outro atendente */}
        {!resolvido && (
          <div className="relative" ref={transferRef}>
            <button
              onClick={() => setTransferindo((v) => !v)}
              title="Transferir chamado para outro atendente"
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                transferindo
                  ? 'border-brand bg-brand/15 text-brand-soft'
                  : 'border-line text-ink-dim hover:bg-surface-2'
              }`}>
              <ArrowLeftRight size={15} /> Transferir
            </button>

            {transferindo && (
              <div className="glass-strong absolute right-0 top-full z-20 mt-2 w-72 animate-fade-in overflow-hidden rounded-xl border border-line shadow-xl">
                <div className="border-b border-line px-3 py-2">
                  <p className="mb-2 text-xs font-semibold text-ink-dim">Transferir atendimento para…</p>
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-surface/60 px-2.5 py-1.5">
                    <Search size={15} className="text-ink-dim" />
                    <input
                      autoFocus
                      value={buscaAtendente}
                      onChange={(e) => setBuscaAtendente(e.target.value)}
                      placeholder="Buscar atendente por nome"
                      className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/70"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {atendentesFiltrados.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-ink-dim">Nenhum atendente encontrado.</p>
                  ) : (
                    atendentesFiltrados.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => transferir(a)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-surface-2">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand-soft">
                          {iniciais(a.nome)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-ink">{a.nome}</div>
                          <div className="truncate text-xs text-ink-dim">{a.setor}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {chamado.atendente && (
                  <div className="flex items-center gap-1.5 border-t border-line px-3 py-2 text-xs text-ink-dim">
                    <Check size={13} className="text-gold" /> Responsável atual: {chamado.atendente}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: st.bg, color: st.fg }}>
          {st.label}
        </span>
      </header>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mx-auto flex max-w-[820px] flex-col gap-2">
          {chamado.mensagens.map((m, i) => (
            <MensagemBolha key={m.id} m={m} anterior={chamado.mensagens[i - 1]} />
          ))}
          {chamado.motivoRecusa && (
            <div className="mt-2 flex items-start gap-2 self-center rounded-xl bg-[rgba(224,90,80,0.12)] px-3 py-2 text-sm text-[#ff9c8e]">
              <ThumbsDown size={16} className="mt-0.5" /> <span>Motivo da recusa: {chamado.motivoRecusa}</span>
            </div>
          )}
          <div ref={fimRef} />
        </div>
      </div>

      {/* Barra de decisão */}
      {!resolvido && (
        <div className="mx-auto w-full max-w-[820px] px-5">
          {recusando ? (
            <div className="mb-2 rounded-xl border border-[#5a2a2a] bg-[rgba(224,90,80,0.10)] p-3">
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Descreva o motivo da recusa (será enviado ao colaborador)…"
                className="h-16 w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/70"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRecusando(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-ink-dim hover:bg-surface-2">
                  Cancelar
                </button>
                <button
                  onClick={() => motivo.trim() && onDecidir('RECUSADO', motivo.trim())}
                  className="rounded-lg bg-[#e05a50] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={!motivo.trim()}>
                  Confirmar recusa
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-2 flex gap-2">
              <button
                onClick={() => onDecidir('APROVADO')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2f9e6a] py-2.5 font-semibold text-white transition hover:brightness-110">
                <ThumbsUp size={17} /> Aprovar ajuste
              </button>
              <button
                onClick={() => setRecusando(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e05a50]/60 py-2.5 font-semibold text-[#ff9c8e] transition hover:bg-[rgba(224,90,80,0.12)]">
                <ThumbsDown size={17} /> Recusar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Composer */}
      <div className="mx-auto w-full max-w-[820px] px-5 pb-5">
        <div className="glass flex items-end gap-2 rounded-[24px] px-3 py-2">
          <button className="pb-2 text-ink-dim" title="Anexar">
            <Paperclip size={20} />
          </button>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Responder ao colaborador…"
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-ink-dim/70"
          />
          <button
            onClick={enviar}
            disabled={!texto.trim()}
            className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white transition disabled:opacity-40">
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

