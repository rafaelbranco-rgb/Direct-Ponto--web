/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { api, apiAtiva, setToken, type UsuarioApi } from '../lib/api';

export type Papel = 'atendente' | 'supervisor';

export interface Gestor {
  id?: string;
  nome: string;
  identificador: string;
  papel: Papel;
}

interface AuthValue {
  gestor: Gestor | null;
  carregando: boolean;
  /** Login demo (sem backend). */
  entrar: (g: Gestor) => void;
  /** Login real contra o backend. Lança erro com mensagem em caso de falha. */
  entrarApi: (identificador: string, senha: string) => Promise<void>;
  sair: () => void;
}

const CHAVE = 'contato-web:gestor';
const AuthContext = createContext<AuthValue | undefined>(undefined);

function mapear(u: UsuarioApi): Gestor {
  return {
    id: u.id,
    nome: u.nome,
    identificador: u.email ?? u.cpf ?? u.matricula ?? '',
    papel: u.papel === 'SUPERVISOR' ? 'supervisor' : 'atendente',
  };
}

function carregarCache(): Gestor | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v ? (JSON.parse(v) as Gestor) : null;
  } catch {
    return null;
  }
}
function salvarCache(g: Gestor | null) {
  try {
    if (g) localStorage.setItem(CHAVE, JSON.stringify(g));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* ignora */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [gestor, setGestor] = useState<Gestor | null>(carregarCache);
  const [carregando, setCarregando] = useState<boolean>(apiAtiva);

  // Com backend ativo, revalida a sessão pelo token ao abrir.
  useEffect(() => {
    if (!apiAtiva) return;
    let vivo = true;
    api
      .me()
      .then((u) => {
        if (!vivo) return;
        const g = mapear(u);
        setGestor(g);
        salvarCache(g);
      })
      .catch(() => {
        if (!vivo) return;
        setToken(null);
        setGestor(null);
        salvarCache(null);
      })
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, []);

  function entrar(g: Gestor) {
    setGestor(g);
    salvarCache(g);
  }

  async function entrarApi(identificador: string, senha: string) {
    const resp = await api.login(identificador, senha);
    setToken(resp.token);
    const g = mapear(resp.usuario);
    setGestor(g);
    salvarCache(g);
  }

  function sair() {
    setToken(null);
    setGestor(null);
    salvarCache(null);
  }

  return (
    <AuthContext.Provider value={{ gestor, carregando, entrar, entrarApi, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa de <AuthProvider>');
  return ctx;
}
