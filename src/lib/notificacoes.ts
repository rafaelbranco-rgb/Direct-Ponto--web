/**
 * Notificações do console do gestor: reage ao evento `notificacao` do backend
 * (novo chamado na fila / mensagem de colaborador) com notificação nativa do
 * navegador + som, respeitando as preferências salvas em Configurações.
 */
const CHAVE = 'contato-web:notif';

type Cfg = { fila: boolean; respostas: boolean; som: boolean; resumo: boolean };
const PADRAO: Cfg = { fila: true, respostas: true, som: false, resumo: true };

function ler(): Cfg {
  try {
    const v = localStorage.getItem(CHAVE);
    return v ? { ...PADRAO, ...(JSON.parse(v) as Cfg) } : PADRAO;
  } catch {
    return PADRAO;
  }
}

/** Pede permissão para notificar (uma vez). Chamar quando o console abre. */
export function pedirPermissaoNotif() {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  } catch {
    /* navegador sem suporte */
  }
}

function tocarBeep() {
  try {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ac = new Ctx();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g);
    g.connect(ac.destination);
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25);
    o.start();
    o.stop(ac.currentTime + 0.26);
  } catch {
    /* ignora */
  }
}

export type NotifPayload = {
  tipo: 'chamado' | 'mensagem' | 'decisao';
  chamadoId?: string;
  protocolo?: string;
  categoria?: string;
  de?: string;
  texto?: string;
};

/** Mostra a notificação para o gestor, conforme o tipo e as preferências. */
export function tratarNotificacao(n: NotifPayload) {
  const cfg = ler();
  let titulo = '';
  let corpo = '';
  if (n.tipo === 'chamado') {
    if (!cfg.fila) return;
    titulo = 'Novo chamado na fila';
    corpo = `${n.de ?? 'Colaborador'} abriu um atendimento${n.protocolo ? ` (#${n.protocolo})` : ''}.`;
  } else if (n.tipo === 'mensagem') {
    if (!cfg.respostas) return;
    titulo = `Mensagem de ${n.de ?? 'colaborador'}`;
    corpo = n.texto || 'Nova mensagem no atendimento.';
  } else {
    return; // 'decisao' é notificação do colaborador, não do gestor
  }
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(titulo, { body: corpo, icon: '/favicon.png' });
    }
  } catch {
    /* ignora */
  }
  if (cfg.som) tocarBeep();
}
