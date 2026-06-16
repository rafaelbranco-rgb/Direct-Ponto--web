import { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Bell,
  Check,
  Inbox,
  KeyRound,
  LogOut,
  Mail,
  MessageSquare,
  Monitor,
  Moon,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Shield,
  Sun,
  User,
  UserCog,
  UserPlus,
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

        {/* Usuários do sistema (qualquer conta — papel é só rótulo) */}
        {apiAtiva && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">Usuários do sistema</h2>
            <CriarUsuario />
          </section>
        )}

        {/* Conta e segurança */}
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-dim">Conta e segurança</h2>
          <TrocarSenha />
          <button
            onClick={sair}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition hover:brightness-110">
            <ArrowLeftRight size={18} /> Trocar de usuário
          </button>
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

  // Busca ao vivo: conforme digita (com pequeno atraso), sem clicar em "Buscar".
  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 2) {
      setLista([]);
      setErro('');
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const t = setTimeout(async () => {
      try {
        setLista(await api.buscarColaboradores(termo));
        setErro('');
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Falha na busca.');
      } finally {
        setCarregando(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [busca]);

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
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
        <Search size={17} className="text-ink-dim" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome, CPF ou matrícula"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/70"
        />
        {carregando && <span className="shrink-0 text-xs text-ink-dim">Buscando…</span>}
      </div>
      {erro && <p className="mt-2 text-sm font-semibold text-[#ff9c8e]">{erro}</p>}
      <div className="mt-1 flex flex-col divide-y divide-line">
        {!carregando && lista.length === 0 && (
          <p className="py-3 text-center text-sm text-ink-dim">
            {busca.trim().length < 2
              ? 'Digite o nome, CPF ou matrícula para buscar.'
              : 'Nenhum colaborador encontrado.'}
          </p>
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

/** Cria um novo usuário do painel. Os papéis têm os mesmos acessos — o papel
 *  serve apenas como rótulo de identificação. */
const PAPEIS: {
  valor: 'ATENDENTE' | 'SUPERVISOR';
  titulo: string;
  desc: string;
  icon: LucideIcon;
  cor: string;
}[] = [
  { valor: 'ATENDENTE', titulo: 'Atendente', desc: 'Atende e resolve chamados', icon: UserCog, cor: '#2bb673' },
  { valor: 'SUPERVISOR', titulo: 'Supervisor / RH', desc: 'Mesmo acesso — rótulo de gestão', icon: Shield, cor: '#7c5cff' },
];

function CriarUsuario() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState<'ATENDENTE' | 'SUPERVISOR'>('ATENDENTE');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setOk('');
    if (!nome.trim() || !email.trim()) return setErro('Preencha o nome e o e-mail.');
    if (senha.length < 6) return setErro('A senha deve ter ao menos 6 caracteres.');
    setEnviando(true);
    try {
      const u = await api.criarAtendente({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        papel,
      });
      setOk(`Usuário "${u.nome}" criado. Ele entra com o e-mail e a senha definidos aqui.`);
      setNome('');
      setEmail('');
      setSenha('');
      setPapel('ATENDENTE');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar o usuário.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={criar} className="glass overflow-hidden rounded-2xl">
      {/* Cabeçalho do cartão */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2/40 px-5 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand-soft">
          <UserPlus size={20} />
        </div>
        <div>
          <div className="font-semibold text-ink">Criar usuário do painel</div>
          <div className="text-xs text-ink-dim">Acesso por e-mail e senha — o usuário pode trocar a senha depois.</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <CampoRotulado rotulo="Nome completo" icon={User}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Maria Souza"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/60"
          />
        </CampoRotulado>

        <CampoRotulado rotulo="E-mail de acesso" icon={Mail}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/60"
          />
        </CampoRotulado>

        <CampoRotulado rotulo="Senha provisória" icon={KeyRound}>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim/60"
          />
        </CampoRotulado>

        {/* Papel (apenas rótulo) */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-dim">Papel (somente rótulo)</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PAPEIS.map((p) => {
              const ativo = papel === p.valor;
              return (
                <button
                  key={p.valor}
                  type="button"
                  onClick={() => setPapel(p.valor)}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                    ativo ? 'border-brand bg-brand/5' : 'border-line hover:border-line/80 hover:bg-surface-2/40'
                  }`}>
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ background: `${p.cor}22`, color: p.cor }}>
                    <p.icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{p.titulo}</span>
                    <span className="block text-[11px] leading-tight text-ink-dim">{p.desc}</span>
                  </span>
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                      ativo ? 'border-brand bg-brand' : 'border-line'
                    }`}>
                    {ativo && <Check size={11} className="text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {erro && <p className="text-sm font-semibold text-[#ff9c8e]">{erro}</p>}
        {ok && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[#3fcf8e]">
            <Check size={15} /> {ok}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(43,87,173,0.30)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50">
          <UserPlus size={16} /> {enviando ? 'Criando…' : 'Criar usuário'}
        </button>
      </div>
    </form>
  );
}

/** Campo com rótulo + ícone à esquerda (visual consistente do formulário). */
function CampoRotulado({
  rotulo,
  icon: Icon,
  children,
}: {
  rotulo: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-dim">{rotulo}</label>
      <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 transition focus-within:border-brand">
        <Icon size={17} className="shrink-0 text-ink-dim" />
        {children}
      </div>
    </div>
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
