import { useState } from 'react';
import {
  Bell,
  Check,
  Inbox,
  KeyRound,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Shield,
  Sun,
  UserCog,
  Volume2,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '../context/auth';
import { useTema, type Tema } from '../context/theme';
import { ATENDENTES } from '../data/mock';
import { api, apiAtiva, type UsuarioApi } from '../lib/api';
import { iniciais } from '../lib/format';

const OPCOES: { chave: Tema; label: string; icon: LucideIcon; desc: string }[] = [
  { chave: 'system', label: 'Sistema', icon: Monitor, desc: 'Acompanha o tema do computador' },
  { chave: 'light', label: 'Claro', icon: Sun, desc: 'Fundo claro' },
  { chave: 'dark', label: 'Escuro', icon: Moon, desc: 'Fundo navy escuro' },
];

type Notif = { fila: boolean; respostas: boolean; som: boolean; resumo: boolean };
const NOTIF_PADRAO: Notif = { fila: true, respostas: true, som: false, resumo: true };
const NOTIF_CHAVE = 'contato-web:notif';

const NOTIF_ITENS: { chave: keyof Notif; icon: LucideIcon; titulo: string; desc: string }[] = [
  { chave: 'fila', icon: Inbox, titulo: 'Novos chamados na fila', desc: 'Avisar quando entrar um chamado em "Em espera"' },
  { chave: 'respostas', icon: MessageSquare, titulo: 'Respostas dos colaboradores', desc: 'Avisar quando um colaborador responder' },
  { chave: 'som', icon: Volume2, titulo: 'Som de alerta', desc: 'Tocar um som ao receber notificações' },
  { chave: 'resumo', icon: Bell, titulo: 'Resumo diário', desc: 'Receber um resumo dos atendimentos do dia' },
];

function lerNotif(): Notif {
  try {
    const v = localStorage.getItem(NOTIF_CHAVE);
    return v ? { ...NOTIF_PADRAO, ...(JSON.parse(v) as Notif) } : NOTIF_PADRAO;
  } catch {
    return NOTIF_PADRAO;
  }
}

export function Settings() {
  const { tema, definir } = useTema();
  const { gestor, sair } = useAuth();
  const supervisor = gestor?.papel === 'supervisor';
  const conta = ATENDENTES.find((a) => a.nome === gestor?.nome);

  const [notif, setNotif] = useState<Notif>(lerNotif);

  function alterna(chave: keyof Notif) {
    setNotif((prev) => {
      const prox = { ...prev, [chave]: !prev[chave] };
      try {
        localStorage.setItem(NOTIF_CHAVE, JSON.stringify(prox));
      } catch {
        /* ignora */
      }
      return prox;
    });
  }

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

        {/* Perfil */}
        <section className="glass mb-6 flex items-center gap-3 rounded-2xl p-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand/25 text-base font-bold text-brand-soft">
            {iniciais(gestor?.nome ?? 'Atendente')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">{gestor?.nome}</div>
            <div className="text-sm text-ink-dim">
              {conta?.setor ?? 'Atendimento'} · ID {gestor?.identificador}
            </div>
          </div>
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{
              background: supervisor ? 'rgba(124,92,255,0.16)' : 'rgba(43,182,115,0.16)',
              color: supervisor ? '#9d86ff' : '#3fcf8e',
            }}>
            {supervisor ? <Shield size={13} /> : <UserCog size={13} />}
            {supervisor ? 'Supervisor / RH' : 'Atendente'}
          </span>
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

        {/* Notificações */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">Notificações</h2>
          <div className="glass flex flex-col divide-y divide-line rounded-2xl">
            {NOTIF_ITENS.map((n) => (
              <div key={n.chave} className="flex items-center gap-3 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-dim">
                  <n.icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink">{n.titulo}</div>
                  <div className="text-sm text-ink-dim">{n.desc}</div>
                </div>
                <Switch ativo={notif[n.chave]} onToggle={() => alterna(n.chave)} rotulo={n.titulo} />
              </div>
            ))}
          </div>
        </section>

        {/* Senhas de colaboradores (só com backend) */}
        {apiAtiva && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">Senhas de colaboradores</h2>
            <ResetColaborador />
          </section>
        )}

        {/* Conta e segurança */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">Conta e segurança</h2>
          <TrocarSenha />
          <button
            onClick={sair}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e05a50]/50 py-3 font-semibold text-[#ff9c8e] transition hover:bg-[rgba(224,90,80,0.12)]">
            <LogOut size={18} /> Encerrar sessão neste dispositivo
          </button>
        </section>

        <p className="mt-8 text-center text-xs text-ink-dim">Contato • Atendimento — v1.0</p>
      </div>
    </main>
  );
}

function Switch({ ativo, onToggle, rotulo }: { ativo: boolean; onToggle: () => void; rotulo: string }) {
  return (
    <button
      role="switch"
      aria-checked={ativo}
      aria-label={rotulo}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${ativo ? 'bg-brand' : 'bg-surface-2'}`}>
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          ativo ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

/** Atendente busca um colaborador e reseta a senha (gera temporária; força troca). */
function ResetColaborador() {
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState<UsuarioApi[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [temp, setTemp] = useState<Record<string, string>>({});

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      setLista(await api.buscarColaboradores(busca.trim()));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha na busca.');
    } finally {
      setCarregando(false);
    }
  }

  async function resetar(id: string) {
    setErro('');
    try {
      const r = await api.resetarSenhaColaborador(id);
      setTemp((p) => ({ ...p, [id]: r.senhaTemporaria ?? 'definida' }));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível resetar.');
    }
  }

  return (
    <div className="glass rounded-2xl p-4">
      <form onSubmit={buscar} className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
        <Search size={17} className="text-ink-dim" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar colaborador por nome, CPF ou matrícula"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/70"
        />
        <button className="shrink-0 text-xs font-semibold text-brand-soft hover:underline">Buscar</button>
      </form>
      {erro && <p className="mt-2 text-sm font-semibold text-[#ff9c8e]">{erro}</p>}
      <div className="mt-1 flex flex-col divide-y divide-line">
        {carregando && <p className="py-3 text-center text-sm text-ink-dim">Buscando…</p>}
        {!carregando && lista.length === 0 && (
          <p className="py-3 text-center text-sm text-ink-dim">Busque um colaborador para resetar a senha.</p>
        )}
        {lista.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-bold text-brand-soft">
              {iniciais(c.nome)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{c.nome}</div>
              <div className="text-xs text-ink-dim">
                {c.setor ?? '—'}
                {c.cpf ? ` · ${c.cpf}` : ''}
              </div>
              {temp[c.id] && (
                <div className="mt-1 text-xs font-semibold text-[#3fcf8e]">
                  Senha temporária: <span className="font-mono">{temp[c.id]}</span> — informe ao colaborador (ele troca no
                  próximo acesso).
                </div>
              )}
            </div>
            <button
              onClick={() => resetar(c.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-dim transition hover:bg-surface-2">
              <RotateCcw size={14} /> Resetar senha
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrocarSenha() {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    if (!atual || !nova || !confirma) return setErro('Preencha todos os campos.');
    if (nova.length < 6) return setErro('A nova senha deve ter ao menos 6 caracteres.');
    if (nova !== confirma) return setErro('A confirmação não confere com a nova senha.');
    setErro('');
    if (apiAtiva) {
      try {
        await api.trocarMinhaSenha(atual, nova);
      } catch (err) {
        return setErro(err instanceof Error ? err.message : 'Não foi possível trocar a senha.');
      }
    }
    setOk(true);
    setAtual('');
    setNova('');
    setConfirma('');
  }

  return (
    <form onSubmit={salvar} className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2 text-ink">
        <KeyRound size={18} className="text-brand-soft" />
        <span className="font-semibold">Trocar senha</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <CampoSenha valor={atual} onChange={setAtual} placeholder="Senha atual" />
        <CampoSenha valor={nova} onChange={setNova} placeholder="Nova senha" />
        <CampoSenha valor={confirma} onChange={setConfirma} placeholder="Confirmar nova" />
      </div>
      {erro && <p className="mt-2 text-sm font-semibold text-[#ff9c8e]">{erro}</p>}
      {ok && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#3fcf8e]">
          <Check size={15} /> Senha atualizada.
        </p>
      )}
      <button
        type="submit"
        className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
        Salvar nova senha
      </button>
    </form>
  );
}

function CampoSenha({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="password"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-dim/70 focus:border-brand"
    />
  );
}
