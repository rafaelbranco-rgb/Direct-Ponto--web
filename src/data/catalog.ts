import {
  Clock,
  XCircle,
  Sunrise,
  FileText,
  Moon,
  LogOut,
  HelpCircle,
  Footprints,
  Hourglass,
  type LucideIcon,
} from 'lucide-react';

import type { CategoriaCodigo, StatusChamado } from './types';

export const CATEGORIAS: Record<CategoriaCodigo, { label: string; icon: LucideIcon }> = {
  ATRASO: { label: 'Atraso', icon: Clock },
  FALTA: { label: 'Falta', icon: XCircle },
  ENTRADA_ANTECIPADA: { label: 'Entrada Antecipada', icon: Sunrise },
  ATESTADO: { label: 'Envio de Atestado', icon: FileText },
  SAIDA_TARDIA: { label: 'Saída Tardia', icon: Moon },
  SAIDA_ANTECIPADA: { label: 'Saída Antecipada', icon: LogOut },
  ESQUECIMENTO: { label: 'Esquecimento', icon: HelpCircle },
  SAIDA_EXPEDIENTE: { label: 'Saída Durante o Expediente', icon: Footprints },
  BANCO_HORAS: { label: 'Banco de Horas', icon: Hourglass },
};

export const STATUS_UI: Record<StatusChamado, { label: string; bg: string; fg: string; dot: string }> = {
  PENDENTE: { label: 'Pendente', bg: 'rgba(242,182,61,0.16)', fg: '#f2c879', dot: '#f2b63d' },
  EM_ATENDIMENTO: { label: 'Em atendimento', bg: 'rgba(125,167,255,0.16)', fg: '#9dbbf0', dot: '#5e8cff' },
  APROVADO: { label: 'Aprovado', bg: 'rgba(52,190,130,0.16)', fg: '#6fe0a6', dot: '#34be82' },
  RECUSADO: { label: 'Recusado', bg: 'rgba(224,90,80,0.18)', fg: '#ff9c8e', dot: '#e05a50' },
};
