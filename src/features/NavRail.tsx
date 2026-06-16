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

// Todas as abas ficam disponíveis para qualquer conta (papel é só rótulo).
const ITENS: { aba: Aba; icon: LucideIcon; label: string }[] = [
  { aba: 'atendimentos', icon: MessageSquare, label: 'Atendimentos' },
  { aba: 'historico', icon: History, label: 'Histórico' },
  { aba: 'relatorios', icon: BarChart3, label: 'Relatórios' },
];

const CHAVE_RECOLHIDA = 'contato-web:nav-recolhida';

export function NavRail({ aba, onAba }: { aba: Aba; onAba: (a: Aba) => void }) {
  const { gestor, entrar, sair } = useAuth();
  const supervisor = gestor?.papel === 'supervisor';
  const [trocando, setTrocando] = useState(false);
  const [recolhida, setRecolhida] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CHAVE_RECOLHIDA) === '1';
    } catch {
      return false;
    }
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_RECOLHIDA, recolhida ? '1' : '0');
    } catch {
      /* ignora */
    }
  }, [recolhida]);

  useEffect(() => {
    if (!trocando) return;
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setTrocando(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [trocando]);

  function trocarPara(nome: string, papel: Papel, id: string) {
    entrar({ nome, identificador: id, papel });
    setTrocando(false);
  }

  return (
    <nav
      className={`glass-strong relative z-50 flex shrink-0 flex-col border-r border-line py-3 transition-[width] duration-300 ease-[cubic-bezier(0.2,0.84,0.2,1)] ${
        recolhida ? 'w-[76px] px-2' : 'w-[212px] px-3'
      }`}>
      {/* Topo: a PRÓPRIA logo é o botão de recolher/expandir. */}
      <button
        onClick={() => setRecolhida((v) => !v)}
        title={recolhida ? 'Expandir menu' : 'Recolher menu'}
        aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'}
        className={`group flex items-center overflow-hidden rounded-xl py-1 transition ${
          recolhida ? 'justify-center' : 'gap-2.5 px-1'
        }`}>
        <span className="grid shrink-0 place-items-center rounded-xl transition duration-300 group-hover:scale-105 group-active:scale-95">
          <Logo size={40} />
        </span>
        <span
          className={`wordmark whitespace-nowrap text-[19px] font-bold leading-none text-ink transition-all duration-300 ease-[cubic-bezier(0.2,0.84,0.2,1)] ${
            recolhida ? 'max-w-0 -translate-x-2 opacity-0' : 'max-w-[150px] translate-x-0 opacity-100'
          }`}>
          Contato
        </span>
      </button>

      {/* Navegação principal */}
      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        {ITENS.map((it) => (
          <RailBtn
            key={it.aba}
            icon={it.icon}
            label={it.label}
            ativo={aba === it.aba}
            recolhida={recolhida}
            onClick={() => onAba(it.aba)}
          />
        ))}
      </div>

      {/* Rodapé: config, identidade, sair */}
      <div className="flex flex-col gap-1.5">
        <RailBtn
          icon={SettingsIcon}
          label="Configurações"
          ativo={aba === 'config'}
          recolhida={recolhida}
          onClick={() => onAba('config')}
        />

        {/* Identidade do atendente + troca rápida (demo do modelo de filas) */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => !apiAtiva && setTrocando((v) => !v)}
            title={`${gestor?.nome ?? 'Atendente'} — ${supervisor ? 'Supervisor/RH' : 'Atendente'}${apiAtiva ? '' : ' · trocar'}`}
            className={`flex w-full items-center rounded-xl py-1.5 transition ${
              recolhida ? 'justify-center' : 'gap-2.5 px-2'
            } ${apiAtiva ? 'cursor-default' : 'hover:bg-surface-2'}`}>
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/25 text-sm font-bold text-brand-soft">
              {iniciais(gestor?.nome ?? 'Atendente')}
              <span
                className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border-2 border-navy"
                style={{ background: supervisor ? '#7c5cff' : '#2bb673' }}>
                {supervisor ? <Shield size={9} className="text-white" /> : <UserCog size={9} className="text-white" />}
              </span>
            </span>
            {!recolhida && (
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold text-ink">{gestor?.nome ?? 'Atendente'}</span>
                <span className="block truncate text-[11px] text-ink-dim">
                  {supervisor ? 'Supervisor / RH' : 'Atendente'}
                </span>
              </span>
            )}
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

        <RailBtn icon={LogOut} label="Sair" perigo recolhida={recolhida} onClick={sair} />
      </div>
    </nav>
  );
}

function RailBtn({
  icon: Icon,
  label,
  ativo,
  perigo,
  recolhida,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  ativo?: boolean;
  perigo?: boolean;
  recolhida: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group flex items-center rounded-xl text-sm font-semibold transition ${
        recolhida ? 'h-11 w-11 justify-center self-center' : 'w-full gap-3 px-3 py-2.5'
      } ${
        ativo
          ? 'bg-brand text-white shadow-[0_6px_16px_rgba(43,87,173,0.30)]'
          : perigo
            ? 'text-ink-dim hover:bg-[rgba(224,90,80,0.14)] hover:text-[#ff9c8e]'
            : 'text-ink-dim hover:bg-surface-2 hover:text-ink'
      }`}>
      <Icon size={20} className="shrink-0" />
      {!recolhida && <span className="truncate">{label}</span>}
    </button>
  );
}
