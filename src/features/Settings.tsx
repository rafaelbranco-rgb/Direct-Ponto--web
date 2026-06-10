import {
  Bell,
  Monitor,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '../context/auth';
import { useTema, type Tema } from '../context/theme';
import { iniciais } from '../lib/format';

const OPCOES: { chave: Tema; label: string; icon: LucideIcon; desc: string }[] = [
  { chave: 'system', label: 'Sistema', icon: Monitor, desc: 'Acompanha o tema do computador' },
  { chave: 'light', label: 'Claro', icon: Sun, desc: 'Fundo claro' },
  { chave: 'dark', label: 'Escuro', icon: Moon, desc: 'Fundo navy escuro' },
];

const FUTURAS: { icon: LucideIcon; titulo: string; desc: string }[] = [
  { icon: UserCog, titulo: 'Perfil do gestor', desc: 'Nome, foto, equipe e cargo' },
  { icon: Bell, titulo: 'Notificações', desc: 'Alertas de novos chamados e respostas' },
  { icon: ShieldCheck, titulo: 'Conta e segurança', desc: 'Trocar senha e sessões ativas' },
];

export function Settings() {
  const { tema, definir } = useTema();
  const { gestor } = useAuth();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl animate-fade-up px-6 py-8">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand-soft">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">Configurações</h1>
            <p className="text-sm text-ink-dim">Preferências do painel de atendimento.</p>
          </div>
        </div>

        {/* Perfil resumido */}
        <section className="glass mb-6 flex items-center gap-3 rounded-2xl p-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand/25 text-base font-bold text-brand-soft">
            {iniciais(gestor?.nome ?? 'Gestor')}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-ink">{gestor?.nome}</div>
            <div className="text-sm text-ink-dim">Gestor · {gestor?.identificador}</div>
          </div>
        </section>

        {/* Aparência */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">Aparência</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {OPCOES.map((o) => {
              const ativo = tema === o.chave;
              return (
                <button
                  key={o.chave}
                  onClick={() => definir(o.chave)}
                  className={`glass flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition ${
                    ativo ? 'border-brand' : 'border-transparent hover:border-line'
                  }`}>
                  <div className={`flex items-center gap-2 ${ativo ? 'text-brand-soft' : 'text-ink-dim'}`}>
                    <o.icon size={20} />
                    {ativo && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </div>
                  <div className="font-semibold text-ink">{o.label}</div>
                  <div className="text-xs text-ink-dim">{o.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Seções futuras (em construção) */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">Mais</h2>
          <div className="flex flex-col gap-2">
            {FUTURAS.map((f) => (
              <div
                key={f.titulo}
                className="glass flex items-center gap-3 rounded-xl p-4 opacity-80">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-ink-dim">
                  <f.icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-ink">{f.titulo}</div>
                  <div className="text-sm text-ink-dim">{f.desc}</div>
                </div>
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-ink-dim">
                  Em breve
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-ink-dim">Contato • Atendimento — v1.0</p>
      </div>
    </main>
  );
}
