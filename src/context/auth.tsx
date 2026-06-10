/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Gestor {
  nome: string;
  identificador: string;
}

interface AuthValue {
  gestor: Gestor | null;
  entrar: (g: Gestor) => void;
  sair: () => void;
}

const CHAVE = 'contato-web:gestor';
const AuthContext = createContext<AuthValue | undefined>(undefined);

function carregar(): Gestor | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v ? (JSON.parse(v) as Gestor) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [gestor, setGestor] = useState<Gestor | null>(carregar);

  function entrar(g: Gestor) {
    setGestor(g);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(g));
    } catch {
      /* ignora */
    }
  }
  function sair() {
    setGestor(null);
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      /* ignora */
    }
  }

  return <AuthContext.Provider value={{ gestor, entrar, sair }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa de <AuthProvider>');
  return ctx;
}
