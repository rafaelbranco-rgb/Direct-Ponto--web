/**
 * Cliente do backend (Contato API). Centraliza URL, token e endpoints.
 * Se VITE_API_URL estiver vazio, `apiAtiva` é false e o app roda em modo demonstração (mock).
 */
import { io, type Socket } from 'socket.io-client';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const apiAtiva = BASE.length > 0;

const TOKEN_KEY = 'contato-web:token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignora */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function req<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}/api${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
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
  criadoEm: string;
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
  detalhe: (id: string) => req<ChamadoApi>('GET', `/chamados/${id}`),
  enviarMensagem: (id: string, texto: string, anexo?: { nome: string; ehImagem: boolean }) =>
    req<MensagemApi>('POST', `/chamados/${id}/mensagens`, {
      texto,
      anexoNome: anexo?.nome,
      anexoEhImagem: anexo?.ehImagem,
    }),
  atender: (id: string) => req<ChamadoApi>('POST', `/chamados/${id}/atender`),
  decidir: (id: string, decisao: 'APROVADO' | 'RECUSADO', motivo?: string) =>
    req<ChamadoApi>('POST', `/chamados/${id}/decisao`, { decisao, motivo }),
  transferir: (id: string, atendenteId: string) =>
    req<ChamadoApi>('POST', `/chamados/${id}/transferir`, { atendenteId }),

  listarAtendentes: () => req<UsuarioApi[]>('GET', '/usuarios/atendentes'),
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
    transports: ['websocket'],
    auth: { token: getToken() },
  });
  return socket;
}
export function desconectarSocket() {
  socket?.disconnect();
  socket = null;
}
