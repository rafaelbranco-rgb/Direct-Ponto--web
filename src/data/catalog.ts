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
  MessageCircle,
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
  DUVIDAS: { label: 'Dúvidas', icon: MessageCircle },
};

type Esquema = 'light' | 'dark';
interface StatusVis {
  label: string;
  dot: string;
  light: { bg: string; fg: string };
  dark: { bg: string; fg: string };
}

export const STATUS_UI: Record<StatusChamado, StatusVis> = {
  PENDENTE: {
    label: 'Pendente',
    dot: '#e6a92e',
    light: { bg: '#fbeacb', fg: '#8a5e0c' },
    dark: { bg: 'rgba(236,180,74,0.18)', fg: '#f2c879' },
  },
  EM_ATENDIMENTO: {
    label: 'Em atendimento',
    dot: '#4b7be0',
    light: { bg: '#dde7fb', fg: '#27509e' },
    dark: { bg: 'rgba(125,167,255,0.16)', fg: '#9dbbf0' },
  },
  APROVADO: {
    label: 'Aprovado',
    dot: '#2bb673',
    light: { bg: '#d4f1e1', fg: '#157a45' },
    dark: { bg: 'rgba(52,190,130,0.18)', fg: '#6fe0a6' },
  },
  RECUSADO: {
    label: 'Recusado',
    dot: '#e0574d',
    light: { bg: '#fbdfdc', fg: '#b3301c' },
    dark: { bg: 'rgba(224,90,80,0.18)', fg: '#ff9c8e' },
  },
};

export function statusCor(status: StatusChamado, esquema: Esquema) {
  const s = STATUS_UI[status];
  return { ...s[esquema], dot: s.dot, label: s.label };
}
