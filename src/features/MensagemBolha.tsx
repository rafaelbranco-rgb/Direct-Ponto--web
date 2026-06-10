import { Check, FileText, Image as ImageIcon } from 'lucide-react';

import type { Mensagem } from '../data/types';

/** Balão de mensagem (colaborador/atendente/sistema). Usado no chat e no histórico. */
export function MensagemBolha({ m, anterior }: { m: Mensagem; anterior?: Mensagem }) {
  if (m.autor === 'SISTEMA') {
    return (
      <div className="my-1 flex flex-col items-center">
        <span className="rounded-full bg-surface px-3 py-1 text-center text-xs font-semibold text-ink-dim">
          {m.texto}
        </span>
        {m.data && <span className="mt-0.5 text-[11px] text-ink-dim/70">{m.data}</span>}
      </div>
    );
  }

  const ehAtendente = m.autor === 'ATENDENTE';
  const mostrarTopo = !anterior || anterior.autor !== m.autor;

  return (
    <div className={`flex animate-fade-up flex-col ${ehAtendente ? 'items-end' : 'items-start'}`}>
      {mostrarTopo && !ehAtendente && (
        <span className="mb-0.5 ml-1 text-[11px] font-semibold text-ink-dim">Colaborador</span>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
          ehAtendente
            ? 'rounded-br-md bg-brand text-white'
            : 'rounded-bl-md border border-line bg-surface text-ink'
        }`}>
        {m.anexo &&
          (m.anexo.ehImagem ? (
            <div className="mb-1 flex h-32 w-44 items-center justify-center rounded-lg bg-black/25 text-white/70">
              <ImageIcon size={26} />
            </div>
          ) : (
            <div className="mb-1 flex items-center gap-2">
              <FileText size={18} /> <span className="text-sm font-semibold">{m.anexo.nome}</span>
            </div>
          ))}
        {m.texto && <p className="text-[15px] leading-snug">{m.texto}</p>}
        <div className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${ehAtendente ? 'text-white/75' : 'text-ink-dim'}`}>
          {m.horario}
          {ehAtendente && <Check size={13} className="text-[#8be9c0]" />}
        </div>
      </div>
    </div>
  );
}
