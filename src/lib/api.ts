/**
 * Cliente do backend (Contato API). Centraliza URL, token e endpoints.
 * Se VITE_API_URL estiver vazio, `apiAtiva` é false e o app roda em modo demonstração (mock).
 */
import { io, type Socket } from 'socket.io-client';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const apiAtiva = BASE.length > 0;

const TOKEN_KEY = 'contato-web:token';

/**
 * Sessão POR ABA: cada aba guarda a própria sessão em sessionStorage, então é
 * possível ficar logado em contas diferentes em abas diferentes (trocar de
 * conta numa aba não afeta a outra). Para manter o login ao reabrir o navegador
 * / abrir uma aba nova, a sessão é "semeada" a partir do localStorage na 1ª
 * leitura; ao logar, grava-se nos dois (sessionStorage = esta aba; localStorage
 * = última sessão, herdada por abas novas).
 */
export function lerArmazenado(chave: string): string | null {
  try {
    let v = sessionStorage.getItem(chave);
    if (v === null) {
      v = localStorage.getItem(chave);
      if (v !== null) sessionStorage.setItem(chave, v); // fixa nesta aba
    }
    return v;
  } catch {
    return null;
  }
}
export function gravarArmazenado(chave: string, valor: string | null) {
  try {
    if (valor !== null) {
      sessionStorage.setItem(chave, valor);
      localStorage.setItem(chave, valor);
    } else {
      sessionStorage.removeItem(chave);
      localStorage.removeItem(chave);
    }
  } catch {
    /* ignora */
  }
}

export function getToken(): string | null {
  return lerArmazenado(TOKEN_KEY);
}
export function setToken(token: string | null) {
  gravarArmazenado(TOKEN_KEY, token);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Tempo máximo de espera por resposta antes de abortar (rede fraca não trava a tela). */
const TIMEOUT_MS = 15000;

async function req<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const token = getToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${caminho}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: ctrl.signal,
    });
  } catch {
    // Falha de rede ou timeout: status 0 (não é 401/403 → não desloga a sessão).
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique a internet e tente de novo.');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return undefined as T;
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(dados?.message) ? dados.message.join(', ') : (dados?.message ?? `Erro ${res.status}`);
    throw new ApiError(res.status, msg);
  }
  return dados as T;
}

/* ───────── Tipos espelhando o backend ───────── */
export type PapelApi = 'ATENDENTE' | 'SUPERVISOR' | null;
export interface UsuarioApi {
  id: string;
  tipo: 'COLABORADOR' | 'ATENDENTE';
  nome: string;
  cpf: string | null;
  matricula: string | null;
  email: string | null;
  setor: string | null;
  papel: PapelApi;
  senhaDefinida: boolean;
  precisaTrocarSenha: boolean;
  ativo: boolean;
}
export interface MensagemApi {
  id: string;
  chamadoId: string;
  autor: 'COLABORADOR' | 'ATENDENTE' | 'SISTEMA';
  texto: string;
  horario: string | null;
  anexoNome: string | null;
  anexoEhImagem: boolean | null;
  anexoMime?: string | null;
  anexoArquivo?: string | null;
  criadoEm: string;
}

/** URL (com token na query, p/ <img>/<a>) para baixar/ver um anexo de mensagem. */
export function urlAnexo(mensagemId: string): string {
  const t = getToken();
  return `${BASE}/api/anexos/${mensagemId}${t ? `?token=${encodeURIComponent(t)}` : ''}`;
}
export interface ChamadoApi {
  id: string;
  protocolo: string;
  colaborador: UsuarioApi;
  colaboradorId: string;
  categoria: string;
  status: 'PENDENTE' | 'EM_ATENDIMENTO' | 'APROVADO' | 'RECUSADO';
  dataOcorrencia: string;
  horarioOriginal: string | null;
  horarioProposto: string | null;
  descricao: string | null;
  atendente: UsuarioApi | null;
  atendenteId: string | null;
  motivoRecusa: string | null;
  mensagens?: MensagemApi[];
  criadoEm: string;
  atualizadoEm?: string;
}
export interface FilasApi {
  emEspera: ChamadoApi[];
  emAtendimento: ChamadoApi[];
  encerrados: ChamadoApi[];
}
export interface LoginResp {
  token: string;
  usuario: UsuarioApi;
  precisaTrocarSenha: boolean;
}

/* ───────── Endpoints ───────── */
export const api = {
  login: (identificador: string, senha: string) =>
    req<LoginResp>('POST', '/auth/login', { identificador, senha }),
  me: () => req<UsuarioApi>('GET', '/auth/me'),

  listarChamados: () => req<FilasApi>('GET', '/chamados'),
  /** Histórico completo (todos os chamados) — igual para qualquer atendente. */
  listarHistorico: () => req<ChamadoApi[]>('GET', '/chamados/historico'),
  detalhe: (id: string) => req<ChamadoApi>('GET', `/chamados/${id}`),
  enviarMensagem: (id: string, texto: string, anexo?: { nome: string; ehImagem: boolean }) =>
    req<MensagemApi>('POST', `/chamados/${id}/mensagens`, {
      texto,
      anexoNome: anexo?.nome,
      anexoEhImagem: anexo?.ehImagem,
    }),
  /** Sobe um arquivo (foto/documento) como mensagem. Não usa req() por ser multipart. */
  enviarAnexo: async (id: string, arquivo: File): Promise<MensagemApi> => {
    const form = new FormData();
    form.append('arquivo', arquivo, arquivo.name);
    const token = getToken();
    const res = await fetch(`${BASE}/api/chamados/${id}/anexos`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(dados?.message) ? dados.message.join(', ') : (dados?.message ?? `Erro ${res.status}`);
      throw new ApiError(res.status, msg);
    }
    return dados as MensagemApi;
  },
  atender: (id: string) => req<ChamadoApi>('POST', `/chamados/${id}/atender`),
  decidir: (id: string, decisao: 'APROVADO' | 'RECUSADO', motivo?: string) =>
    req<ChamadoApi>('POST', `/chamados/${id}/decisao`, { decisao, motivo }),
  transferir: (id: string, atendenteId: string) =>
    req<ChamadoApi>('POST', `/chamados/${id}/transferir`, { atendenteId }),

  listarAtendentes: () => req<UsuarioApi[]>('GET', '/usuarios/atendentes'),
  criarAtendente: (dados: { nome: string; email: string; senha: string; papel: 'ATENDENTE' | 'SUPERVISOR' }) =>
    req<UsuarioApi>('POST', '/usuarios/atendentes', dados),
  buscarColaboradores: (busca: string) =>
    req<UsuarioApi[]>('GET', `/usuarios/colaboradores?busca=${encodeURIComponent(busca)}`),
  resetarSenhaColaborador: (id: string, novaSenha?: string) =>
    req<{ ok: boolean; senhaTemporaria?: string }>('POST', `/usuarios/colaboradores/${id}/resetar-senha`, {
      novaSenha,
    }),
  trocarMinhaSenha: (senhaAtual: string | undefined, novaSenha: string) =>
    req<{ ok: boolean }>('PATCH', '/usuarios/me/senha', { senhaAtual, novaSenha }),
};

/* ───────── WebSocket (chat em tempo real) ───────── */
let socket: Socket | null = null;
export function conectarSocket(): Socket | null {
  if (!apiAtiva) return null;
  if (socket?.connected) return socket;
  socket = io(`${BASE}/chat`, {
    // WebSocket primeiro; cai para long-polling em rede fraca (Wi-Fi distante).
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: { token: getToken() },
  });
  return socket;
}
export function desconectarSocket() {
  socket?.disconnect();
  socket = null;
}
