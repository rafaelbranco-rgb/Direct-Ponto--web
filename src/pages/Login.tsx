import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, User, Eye, EyeOff } from 'lucide-react';

import { Logo } from '../components/Logo';
import { useAuth } from '../context/auth';
import { ATENDENTES } from '../data/mock';
import { apiAtiva } from '../lib/api';

export function Login() {
  const navigate = useNavigate();
  const { entrar, entrarApi } = useAuth();
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identificador.trim() || !senha.trim()) {
      setErro('Informe seu CPF/matrícula e a senha.');
      return;
    }
    if (apiAtiva) {
      // Login real contra o backend.
      setEnviando(true);
      setErro('');
      try {
        await entrarApi(identificador.trim(), senha);
        navigate('/');
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
      } finally {
        setEnviando(false);
      }
      return;
    }
    // Modo demonstração (sem backend): entra como um atendente fictício.
    const demo = ATENDENTES.find((a) => a.papel === 'atendente') ?? ATENDENTES[0];
    entrar({ nome: demo.nome, identificador: identificador.trim(), papel: demo.papel });
    navigate('/');
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Logo size={120} />
          <h1 className="wordmark mt-3 text-[34px] font-bold text-ink drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            Contato
          </h1>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-gold/70" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Atendimento</span>
            <span className="h-px w-6 bg-gold/70" />
          </div>
          <p className="mt-3 text-center text-sm leading-5 text-ink-dim">
            Painel do gestor — responda às justificativas de ponto da sua equipe.
          </p>
        </div>

        <form onSubmit={fazerLogin} className="glass rounded-[22px] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.32)]">
          <h2 className="text-[22px] font-bold text-ink">Acesse o painel</h2>
          <p className="mt-1 text-sm text-ink-dim">Use seu CPF ou matrícula de gestor.</p>

          <Campo>
            <User size={20} className="text-ink-dim" />
            <input
              value={identificador}
              onChange={(e) => {
                setIdentificador(e.target.value);
                setErro('');
              }}
              placeholder="CPF ou matrícula"
              className="w-full bg-transparent text-ink outline-none placeholder:text-ink-dim/70"
            />
          </Campo>

          <Campo>
            <Lock size={20} className="text-ink-dim" />
            <input
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setErro('');
              }}
              type={verSenha ? 'text' : 'password'}
              placeholder="Senha"
              className="w-full bg-transparent text-ink outline-none placeholder:text-ink-dim/70"
            />
            <button type="button" onClick={() => setVerSenha((v) => !v)} className="text-ink-dim">
              {verSenha ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </Campo>

          {erro && <p className="mt-3 text-sm font-semibold text-[#ff9c8e]">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] bg-brand py-3 font-bold text-white shadow-[0_8px_22px_rgba(43,87,173,0.45)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60">
            {enviando ? 'Entrando…' : 'Entrar'} <ArrowRight size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-dim">Serviços de Conservação e Manutenção</p>
      </div>
    </div>
  );
}

function Campo({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex min-h-[52px] items-center gap-2 rounded-[13px] border border-line bg-surface px-4">
      {children}
    </div>
  );
}
