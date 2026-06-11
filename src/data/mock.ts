import type { Chamado, Colaborador } from './types';

export const COLABORADORES: Colaborador[] = [
  { id: 'c1', nome: 'Rafael Martiniano Barbosa Branco', matricula: '1001', cpf: '035.830.262-50', setor: 'Operações' },
  { id: 'c2', nome: 'Maria Souza', matricula: '1002', cpf: '111.222.333-44', setor: 'Limpeza' },
  { id: 'c3', nome: 'João Pedro Alves', matricula: '1003', cpf: '529.982.247-25', setor: 'Manutenção' },
  { id: 'c4', nome: 'Ana Paula Ferreira', matricula: '1004', cpf: '111.444.777-35', setor: 'Operações' },
  { id: 'c5', nome: 'Carlos Eduardo Lima', matricula: '1005', cpf: '222.333.444-55', setor: 'Portaria' },
];

/** Registro em tempo de execução de colaboradores vindos do backend. */
const registroColaboradores = new Map<string, Colaborador>();
export function registrarColaborador(c: Colaborador) {
  registroColaboradores.set(c.id, c);
}

export function colaboradorPorId(id: string) {
  return registroColaboradores.get(id) ?? COLABORADORES.find((c) => c.id === id);
}

/** Atendentes do console. `supervisor` vê tudo + relatórios; `atendente` atende a própria fila. */
export const ATENDENTES: { id: string; nome: string; setor: string; papel: 'atendente' | 'supervisor' }[] = [
  { id: 'a1', nome: 'Eliza (Gestor)', setor: 'RH', papel: 'supervisor' },
  { id: 'a2', nome: 'Miguel (Gestor)', setor: 'RH', papel: 'atendente' },
  { id: 'a3', nome: 'Patrícia Gomes', setor: 'Departamento Pessoal', papel: 'atendente' },
  { id: 'a4', nome: 'Rodrigo Antunes', setor: 'Departamento Pessoal', papel: 'atendente' },
  { id: 'a5', nome: 'Fernanda Castro', setor: 'Operações', papel: 'atendente' },
  { id: 'a6', nome: 'Bruno Carvalho', setor: 'Operações', papel: 'atendente' },
  { id: 'a7', nome: 'Juliana Mendes', setor: 'RH', papel: 'supervisor' },
];

export const CHAMADOS: Chamado[] = [
  {
    id: 'ch1',
    protocolo: '11164859',
    colaboradorId: 'c1',
    categoria: 'ATRASO',
    status: 'PENDENTE',
    dataOcorrencia: '2026-06-09',
    horarioOriginal: '08:23',
    horarioProposto: '08:00',
    descricao: 'Trânsito intenso na Av. Principal por conta de acidente.',
    criadoEm: '2026-06-09T10:08:00Z',
    naoLidas: 2,
    mensagens: [
      { id: 'm1', autor: 'SISTEMA', texto: 'Protocolo 11164859 — Atendimento solicitado', data: '09/06/2026 às 10:08h' },
      { id: 'm2', autor: 'COLABORADOR', texto: 'Bom dia', horario: '10:08' },
      { id: 'm3', autor: 'COLABORADOR', texto: 'Cheguei atrasado por causa de um acidente na avenida, seguem as fotos.', horario: '10:09' },
      { id: 'm4', autor: 'COLABORADOR', texto: '', horario: '10:09', anexo: { nome: 'transito.jpg', ehImagem: true } },
    ],
  },
  {
    id: 'ch2',
    protocolo: '11164860',
    colaboradorId: 'c2',
    categoria: 'ATESTADO',
    status: 'PENDENTE',
    dataOcorrencia: '2026-06-05',
    descricao: 'Atestado de 1 dia — gripe.',
    temAnexo: true,
    criadoEm: '2026-06-05T18:22:00Z',
    mensagens: [
      { id: 'm1', autor: 'SISTEMA', texto: 'Protocolo 11164860 — Atendimento solicitado', data: '05/06/2026 às 18:22h' },
      { id: 'm2', autor: 'COLABORADOR', texto: 'Boa noite, segue o atestado da consulta de hoje.', horario: '18:22' },
      { id: 'm3', autor: 'COLABORADOR', texto: '', horario: '18:22', anexo: { nome: 'atestado.pdf', ehImagem: false } },
    ],
  },
  {
    id: 'ch3',
    protocolo: '11164712',
    colaboradorId: 'c3',
    categoria: 'ESQUECIMENTO',
    status: 'EM_ATENDIMENTO',
    dataOcorrencia: '2026-06-06',
    horarioProposto: '17:48',
    descricao: 'Esqueci de registrar a saída ao fim do expediente.',
    criadoEm: '2026-06-06T19:00:00Z',
    atendente: 'Miguel (Gestor)',
    naoLidas: 1,
    mensagens: [
      { id: 'm1', autor: 'SISTEMA', texto: 'Protocolo 11164712 — Atendimento solicitado', data: '06/06/2026 às 19:00h' },
      { id: 'm2', autor: 'COLABORADOR', texto: 'Esqueci de bater o ponto na saída ontem, saí 17:48.', horario: '19:00' },
      { id: 'm3', autor: 'SISTEMA', texto: 'Protocolo 11164712 — Atendimento iniciado por MIGUEL', data: '08/06/2026 às 09:12h' },
      { id: 'm4', autor: 'ATENDENTE', texto: 'Bom dia! Verifiquei no Nexti, consta a entrada mas não a saída. Pode confirmar o horário?', horario: '09:12' },
      { id: 'm5', autor: 'COLABORADOR', texto: 'Confirmo, 17:48.', horario: '09:30' },
    ],
  },
  {
    id: 'ch4',
    protocolo: '11164501',
    colaboradorId: 'c1',
    categoria: 'ATRASO',
    status: 'APROVADO',
    dataOcorrencia: '2026-06-02',
    horarioOriginal: '08:15',
    horarioProposto: '08:00',
    descricao: 'Consulta médica de rotina pela manhã.',
    criadoEm: '2026-06-02T09:05:00Z',
    atendente: 'Miguel (Gestor)',
    mensagens: [
      { id: 'm1', autor: 'SISTEMA', texto: 'Protocolo 11164501 — Atendimento solicitado', data: '02/06/2026 às 09:05h' },
      { id: 'm2', autor: 'COLABORADOR', texto: 'Tinha consulta marcada, cheguei 08:15.', horario: '09:05' },
      { id: 'm3', autor: 'ATENDENTE', texto: 'Tudo certo, ajuste aprovado e lançado.', horario: '11:40' },
      { id: 'm4', autor: 'SISTEMA', texto: 'Protocolo 11164501 — Atendimento finalizado por MIGUEL (Aprovado)', data: '02/06/2026 às 11:40h' },
    ],
  },
  {
    id: 'ch5',
    protocolo: '11163998',
    colaboradorId: 'c4',
    categoria: 'FALTA',
    status: 'RECUSADO',
    dataOcorrencia: '2026-05-28',
    descricao: 'Falta por motivo pessoal, sem comprovante.',
    criadoEm: '2026-05-28T20:10:00Z',
    atendente: 'Eliza (Gestor)',
    motivoRecusa: 'Falta sem comprovante não pode ser abonada. Será descontada.',
    mensagens: [
      { id: 'm1', autor: 'SISTEMA', texto: 'Protocolo 11163998 — Atendimento solicitado', data: '28/05/2026 às 20:10h' },
      { id: 'm2', autor: 'COLABORADOR', texto: 'Faltei por motivo pessoal, não tenho comprovante.', horario: '20:10' },
      { id: 'm3', autor: 'ATENDENTE', texto: 'Sem comprovante não é possível abonar, infelizmente.', horario: '08:50' },
      { id: 'm4', autor: 'SISTEMA', texto: 'Protocolo 11163998 — Atendimento finalizado por ELIZA (Recusado)', data: '29/05/2026 às 08:50h' },
    ],
  },
  {
    id: 'ch6',
    protocolo: '11164888',
    colaboradorId: 'c5',
    categoria: 'SAIDA_ANTECIPADA',
    status: 'PENDENTE',
    dataOcorrencia: '2026-06-09',
    horarioOriginal: '16:10',
    horarioProposto: '17:00',
    descricao: 'Saída antecipada autorizada verbalmente pela supervisão.',
    criadoEm: '2026-06-09T16:30:00Z',
    naoLidas: 1,
    mensagens: [
      { id: 'm1', autor: 'SISTEMA', texto: 'Protocolo 11164888 — Atendimento solicitado', data: '09/06/2026 às 16:30h' },
      { id: 'm2', autor: 'COLABORADOR', texto: 'Saí 16:10 com autorização do supervisor.', horario: '16:30' },
    ],
  },
  {
    id: 'ch7',
    protocolo: '11164903',
    colaboradorId: 'c2',
    categoria: 'ATESTADO',
    status: 'EM_ATENDIMENTO',
    dataOcorrencia: '2026-06-08',
    descricao: 'Atestado de acompanhamento (consulta de dependente).',
    temAnexo: true,
    criadoEm: '2026-06-08T11:15:00Z',
    atendente: 'Patrícia Gomes',
    naoLidas: 2,
    mensagens: [
      { id: 'm1', autor: 'SISTEMA', texto: 'Protocolo 11164903 — Atendimento solicitado', data: '08/06/2026 às 11:15h' },
      { id: 'm2', autor: 'COLABORADOR', texto: 'Levei meu filho ao médico, segue o atestado de acompanhamento.', horario: '11:15' },
      { id: 'm3', autor: 'COLABORADOR', texto: '', horario: '11:16', anexo: { nome: 'atestado-acomp.pdf', ehImagem: false } },
      { id: 'm4', autor: 'SISTEMA', texto: 'Protocolo 11164903 — Atendimento iniciado por PATRÍCIA', data: '08/06/2026 às 14:02h' },
      { id: 'm5', autor: 'COLABORADOR', texto: 'Bom dia, conseguem analisar hoje?', horario: '08:30' },
    ],
  },
];
