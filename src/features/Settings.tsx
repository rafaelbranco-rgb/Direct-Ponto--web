import { Monitor, Moon, Sun, X, type LucideIcon } from 'lucide-react';

import { useTema, type Tema } from '../context/theme';

const OPCOES: { chave: Tema; label: string; icon: LucideIcon }[] = [
  { chave: 'system', label: 'Sistema', icon: Monitor },
  { chave: 'light', label: 'Claro', icon: Sun },
  { chave: 'dark', label: 'Escuro', icon: Moon },
];

export function Settings({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { tema, definir } = useTema();
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onFechar} aria-label="Fechar" />
      <div className="glass-strong relative w-full max-w-sm rounded-2xl p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Configurações</h2>
          <button onClick={onFechar} className="grid h-8 w-8 place-items-center rounded-lg text-ink-dim hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-dim">Aparência</p>
        <div className="flex flex-col gap-2">
          {OPCOES.map((o) => {
            const ativo = tema === o.chave;
            return (
              <button
                key={o.chave}
                onClick={() => definir(o.chave)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  ativo
                    ? 'border-brand bg-brand/15 text-ink'
                    : 'border-line text-ink-dim hover:bg-surface-2'
                }`}>
                <o.icon size={20} className={ativo ? 'text-brand-soft' : ''} />
                <span className="flex-1 font-semibold text-ink">{o.label}</span>
                {ativo && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-center text-xs text-ink-dim">Contato • Atendimento — v1.0</p>
      </div>
    </div>
  );
}
