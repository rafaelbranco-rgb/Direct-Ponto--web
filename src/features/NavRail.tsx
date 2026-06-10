import { BarChart3, History, LogOut, MessageSquare, type LucideIcon } from 'lucide-react';

import { Logo } from '../components/Logo';
import { useAuth } from '../context/auth';
import { iniciais } from '../lib/format';

export type Aba = 'atendimentos' | 'historico' | 'relatorios';

const ITENS: { aba: Aba; icon: LucideIcon; label: string }[] = [
  { aba: 'atendimentos', icon: MessageSquare, label: 'Atendimentos' },
  { aba: 'historico', icon: History, label: 'Histórico' },
  { aba: 'relatorios', icon: BarChart3, label: 'Relatórios' },
];

export function NavRail({ aba, onAba }: { aba: Aba; onAba: (a: Aba) => void }) {
  const { gestor, sair } = useAuth();

  return (
    <nav className="glass-strong flex w-[84px] shrink-0 flex-col items-center border-r border-line py-3">
      <Logo size={42} />

      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        {ITENS.map((it) => (
          <RailBtn key={it.aba} icon={it.icon} label={it.label} ativo={aba === it.aba} onClick={() => onAba(it.aba)} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <div
          title={gestor?.nome}
          className="grid h-10 w-10 place-items-center rounded-full bg-brand/25 text-sm font-bold text-brand-soft">
          {iniciais(gestor?.nome ?? 'Gestor')}
        </div>
        <RailBtn icon={LogOut} label="Sair" perigo onClick={sair} />
      </div>
    </nav>
  );
}

function RailBtn({
  icon: Icon,
  label,
  ativo,
  perigo,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  ativo?: boolean;
  perigo?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex w-[68px] flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition ${
        ativo
          ? 'bg-brand/90 text-white'
          : perigo
            ? 'text-ink-dim hover:bg-[rgba(224,90,80,0.14)] hover:text-[#ff9c8e]'
            : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
      }`}>
      <Icon size={21} />
      <span className="leading-none">{label}</span>
    </button>
  );
}
