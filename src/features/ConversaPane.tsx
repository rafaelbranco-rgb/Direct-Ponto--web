import { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, ThumbsDown, ThumbsUp, History } from 'lucide-react';

import { MensagemBolha } from './MensagemBolha';
import { CATEGORIAS, statusCor } from '../data/catalog';
import { colaboradorPorId } from '../data/mock';
import type { Chamado } from '../data/types';
import { useTema } from '../context/theme';
import { iniciais } from '../lib/format';

interface Props {
  chamado: Chamado;
  totalDoColaborador: number;
  onEnviar: (texto: string) => void;
  onDecidir: (decisao: 'APROVADO' | 'RECUSADO', motivo?: string) => void;
  onVerHistorico: () => void;
}

export function ConversaPane({ chamado, totalDoColaborador, onEnviar, onDecidir, onVerHistorico }: Props) {
  const { esquema } = useTema();
  const colaborador = colaboradorPorId(chamado.colaboradorId);
  const cat = CATEGORIAS[chamado.categoria];
  const st = statusCor(chamado.status, esquema);
  const Icon = cat.icon;
  const resolvido = chamado.status === 'APROVADO' || chamado.status === 'RECUSADO';

  const [texto, setTexto] = useState('');
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chamado.id, chamado.mensagens.length]);

  function enviar() {
    const t = texto.trim();
    if (!t) return;
    onEnviar(t);
    setTexto('');
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col animate-fade-in">
      {/* Cabeçalho da conversa */}
      <header className="glass-strong flex items-center gap-3 border-b border-line px-5 py-3">
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

