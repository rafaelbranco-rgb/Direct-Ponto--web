import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Tema = 'system' | 'light' | 'dark';
type Esquema = 'light' | 'dark';

interface ThemeValue {
  tema: Tema;
  esquema: Esquema;
  definir: (t: Tema) => void;
}

const CHAVE = 'contato-web:tema';
const ThemeContext = createContext<ThemeValue | undefined>(undefined);

function carregar(): Tema {
  try {
    const v = localStorage.getItem(CHAVE);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* ignora */
  }
  return 'dark';
}

function sistemaEscuro(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(carregar);
  const [sysDark, setSysDark] = useState<boolean>(sistemaEscuro);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSysDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const esquema: Esquema = tema === 'system' ? (sysDark ? 'dark' : 'light') : tema;

  useEffect(() => {
    document.documentElement.dataset.theme = esquema;
  }, [esquema]);

  function definir(t: Tema) {
    setTema(t);
    try {
      localStorage.setItem(CHAVE, t);
    } catch {
      /* ignora */
    }
  }

  return <ThemeContext.Provider value={{ tema, esquema, definir }}>{children}</ThemeContext.Provider>;
}

export function useTema() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTema precisa de <ThemeProvider>');
  return ctx;
}
