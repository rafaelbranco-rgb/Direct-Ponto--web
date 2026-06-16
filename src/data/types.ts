/** Domínio do console do gestor (espelha o app do colaborador). */

export type CategoriaCodigo =
  | 'ATRASO'
  | 'FALTA'
  | 'ENTRADA_ANTECIPADA'
  | 'ATESTADO'
  | 'SAIDA_TARDIA'
  | 'SAIDA_ANTECIPADA'
  | 'ESQUECIMENTO'
  | 'SAIDA_EXPEDIENTE'
  | 'BANCO_HORAS';

/** Status do chamado na ótica do atendimento (gestor). */
export type StatusChamado = 'PENDENTE' | 'EM_ATENDIMENTO' | 'APROVADO' | 'RECUSADO';

export type AutorMensagem = 'COLABORADOR' | 'ATENDENTE' | 'SISTEMA';

export interface Anexo {
  nome: string;
  ehImagem: boolean;
  url?: string;
}

export interface Mensagem {
  id: string;
  autor: AutorMensagem;
  texto: string;
  /** HH:MM (colaborador/atendente) */
  horario?: string;
  /** linha de data das mensagens de sistema */
  data?: string;
  anexo?: Anexo;
}

export interface Colaborador {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  setor: string;
}

export interface Chamado {
  id: string;
  protocolo: string;
  colaboradorId: string;
  categoria: CategoriaCodigo;
  status: StatusChamado;
  dataOcorrencia: string; // YYYY-MM-DD
  horarioOriginal?: string;
  horarioProposto?: string;
  descricao: string;
  temAnexo?: boolean;
  criadoEm: string; // ISO
  /** atendente responsável (gestor) — nome para exibição */
  atendente?: string;
  /** id do atendente responsável (modo backend) */
  atendenteId?: string;
  motivoRecusa?: string;
  /** última atualização (ISO) — usada como data de encerramento dos resolvidos */
  atualizadoEm?: string;
  /** mensagens do colaborador ainda não lidas pelo gestor */
  naoLidas?: number;
  mensagens: Mensagem[];
}
