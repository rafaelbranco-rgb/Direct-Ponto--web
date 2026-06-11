import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Check,
  History,
  LogOut,
  MessageSquare,
  Settings as SettingsIcon,
  Shield,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

import { Logo } from '../components/Logo';
import { useAuth, type Papel } from '../context/auth';
import { ATENDENTES } from '../data/mock';
import { apiAtiva } from '../lib/api';
import { iniciais } from '../lib/format';

export type Aba = 'atendimentos' | 'historico' | 'relatorios' | 'config';

const ITENS: { aba: Aba; icon: LucideIcon; label: string; soSupervisor?: boolean }[] = [
  { aba: 'atendimentos', icon: MessageSquare, label: 'Atendimentos' },
  { aba: 'historico', icon: History, label: 'Histórico' },
  { aba: 'relatorios', icon: BarChart3, label: 'Relatórios', soSupervisor: true },
];

export function NavRail({ aba, onAba }: { aba: Aba; onAba: (a: Aba) => void }) {
  const { gestor, entrar, sair } = useAuth();
  const supervisor = gestor?.papel === 'supervisor';
  const [trocando, setTrocando] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trocando) return;
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setTrocando(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [trocando]);

  const itens = ITENS.filter((it) => !it.soSupervisor || supervisor);

  function trocarPara(nome: string, papel: Papel, id: string) {
    entrar({ nome, identificador: id, papel });
    setTrocando(false);
  }

  return (
    <nav className="glass-strong relative z-50 flex w-[84px] shrink-0 flex-col items-center border-r border-line py-3">
      <Logo size={42} />

      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        {itens.map((it) => (
          <RailBtn key={it.aba} icon={it.icon} label={it.label} ativo={aba === it.aba} onClick={() => onAba(it.aba)} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <RailBtn icon={SettingsIcon} label="Config." ativo={aba === 'config'} onClick={() => onAba('config')} />

        {/* Identidade do atendente + troca rápida (demo do modelo de filas) */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => !apiAtiva && setTrocando((v) => !v)}
            title={
              apiAtiva
                ? `${gestor?.nome ?? 'Atendente'} — ${supervisor ? 'Supervisor/RH' : 'Atendente'}`
                : `${gestor?.nome ?? 'Atendente'} — ${supervisor ? 'Supervisor/RH' : 'Atendente'} · trocar`
            }
            className={`mt-1 grid h-10 w-10 place-items-center rounded-full bg-brand/25 text-sm font-bold text-brand-soft ring-2 ring-transparent transition ${
              apiAtiva ? 'cursor-default' : 'hover:ring-gold/60'
            }`}>
            {iniciais(gestor?.nome ?? 'Atendente')}
            <span
              className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border-2 border-navy"
              style={{ background: supervisor ? '#7c5cff' : '#2bb673' }}>
              {supervisor ? <Shield size={9} className="text-white" /> : <UserCog size={9} className="text-white" />}
            </span>
          </button>

          {!apiAtiva && trocando && (
            <div className="glass-strong absolute bottom-0 left-full z-30 ml-3 w-64 animate-fade-in overflow-hidden rounded-xl border border-line shadow-xl">
              <div className="border-b border-line px-3 py-2 text-xs font-semibold text-ink-dim">
                Entrar como atendente (demo)
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {ATENDENTES.map((a) => {
                  const atual = a.nome === gestor?.nome;
                  return (
                    <button
                      key={a.id}
                      onClick={() => trocarPara(a.nome, a.papel, a.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-surface-2">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/20 text-[11px] font-bold text-brand-soft">
                        {iniciais(a.nome)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">{a.nome}</div>
                        <div className="flex items-center gap-1 text-[11px] text-ink-dim">
                          {a.papel === 'supervisor' ? (
                            <><Shield size={11} className="text-[#7c5cff]" /> Supervisor/RH</>
                          ) : (
                            <><UserCog size={11} className="text-[#2bb673]" /> Atendente</>
                          )}
                          <span>· {a.setor}</span>
                        </div>
                      </div>
                      {atual && <Check size={15} className="shrink-0 text-gold" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
