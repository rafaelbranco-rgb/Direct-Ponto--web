/** Converte os dados do backend para os tipos que os componentes já usam. */
import { registrarColaborador } from '../data/mock';
import type { CategoriaCodigo, Chamado, Mensagem } from '../data/types';
import { urlAnexo, type ChamadoApi, type MensagemApi } from './api';

function dataLinha(iso: string, horario: string | null): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const base = `${dd}/${mm}/${d.getFullYear()}`;
  return horario ? `${base} às ${horario}h` : base;
}

export function adaptarMensagem(m: MensagemApi): Mensagem {
  const sistema = m.autor === 'SISTEMA';
  return {
    id: m.id,
    autor: m.autor,
    texto: m.texto,
    horario: sistema ? undefined : (m.horario ?? undefined),
    data: sistema ? dataLinha(m.criadoEm, m.horario) : undefined,
    anexo: m.anexoNome
      ? {
          nome: m.anexoNome,
          ehImagem: !!m.anexoEhImagem,
          // URL só existe para anexos realmente armazenados (mensagens novas).
          url: m.anexoArquivo ? urlAnexo(m.id) : undefined,
        }
      : undefined,
  };
}

export function adaptarChamado(c: ChamadoApi): Chamado {
  if (c.colaborador) {
    registrarColaborador({
      id: c.colaborador.id,
      nome: c.colaborador.nome,
      matricula: c.colaborador.matricula ?? '',
      cpf: c.colaborador.cpf ?? '',
      setor: c.colaborador.setor ?? '',
    });
  }
  return {
    id: c.id,
    protocolo: c.protocolo,
    colaboradorId: c.colaboradorId,
    categoria: c.categoria as CategoriaCodigo,
    status: c.status,
    dataOcorrencia: c.dataOcorrencia,
    horarioOriginal: c.horarioOriginal ?? undefined,
    horarioProposto: c.horarioProposto ?? undefined,
    descricao: c.descricao ?? '',
    criadoEm: c.criadoEm,
    atendente: c.atendente?.nome ?? undefined,
    atendenteId: c.atendenteId ?? undefined,
    motivoRecusa: c.motivoRecusa ?? undefined,
    atualizadoEm: c.atualizadoEm ?? undefined,
    mensagens: (c.mensagens ?? []).map(adaptarMensagem),
  };
}
