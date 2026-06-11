const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function dataBR(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

export function diaMes(iso: string): string {
  const [, mes, dia] = iso.slice(0, 10).split('-');
  const i = Number(mes) - 1;
  if (!dia || i < 0 || i > 11) return iso;
  return `${dia} ${MESES[i]}`;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const a = partes[0]?.[0] ?? '';
  const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (a + b).toUpperCase();
}

export function horaAgora(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Tempo de espera curto, no estilo do Nexti ("6 horas", "2 dias"). */
export function tempoEspera(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hora${h > 1 ? 's' : ''}`;
  const d = Math.floor(h / 24);
  return `${d} dia${d > 1 ? 's' : ''}`;
}
