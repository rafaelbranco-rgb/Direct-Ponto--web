import { Check, FileText, Image as ImageIcon } from 'lucide-react';

import type { Mensagem } from '../data/types';

/** Balão de mensagem (colaborador/atendente/sistema). Usado no chat e no histórico. */
export function MensagemBolha({ m, anterior }: { m: Mensagem; anterior?: Mensagem }) {
  if (m.autor === 'SISTEMA') {
    return (
      <div className="my-1.5 flex flex-col items-center">
        <span className="rounded-full bg-surface px-3.5 py-1.5 text-center text-[13px] font-semibold text-ink-dim">
          {m.texto}
        </span>
        {m.data && <span className="mt-0.5 text-xs text-ink-dim/70">{m.data}</span>}
      </div>
    );
  }

  const ehAtendente = m.autor === 'ATENDENTE';
  const mostrarTopo = !anterior || anterior.autor !== m.autor;

  return (
    <div className={`flex animate-fade-up flex-col ${ehAtendente ? 'items-end' : 'items-start'}`}>
      {mostrarTopo && !ehAtendente && (
        <span className="mb-0.5 ml-1 text-xs font-semibold text-ink-dim">Colaborador</span>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          ehAtendente
            ? 'rounded-br-md bg-brand text-white'
            : 'rounded-bl-md border border-line bg-surface text-ink'
        }`}>
        {m.anexo &&
          (m.anexo.ehImagem ? (
            m.anexo.url ? (
              <a href={m.anexo.url} target="_blank" rel="noreferrer" className="mb-1 block">
                <img
                  src={m.anexo.url}
                  alt={m.anexo.nome}
                  loading="lazy"
                  className="max-h-64 w-auto max-w-full rounded-lg object-cover"
                />
              </a>
            ) : (
              // Anexo antigo (sem arquivo armazenado) — não há como exibir.
              <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                <ImageIcon size={18} /> <span>{m.anexo.nome} (indisponível)</span>
              </div>
            )
          ) : m.anexo.url ? (
            <a
              href={m.anexo.url}
              target="_blank"
              rel="noreferrer"
              className="mb-1 flex items-center gap-2 underline-offset-2 hover:underline">
              <FileText size={20} /> <span className="text-[15px] font-semibold">{m.anexo.nome}</span>
            </a>
          ) : (
            <div className="mb-1 flex items-center gap-2">
              <FileText size={20} /> <span className="text-[15px] font-semibold">{m.anexo.nome}</span>
            </div>
          ))}
        {m.texto && <p className="whitespace-pre-line text-[16.5px] leading-relaxed">{m.texto}</p>}
        <div className={`mt-0.5 flex items-center justify-end gap-1 text-xs ${ehAtendente ? 'text-white/75' : 'text-ink-dim'}`}>
          {m.horario}
          {ehAtendente && <Check size={14} className="text-[#8be9c0]" />}
        </div>
      </div>
    </div>
  );
}
