const pad = (n) => String(n).padStart(2, '0');

// chave de dia no fuso local (não usar toISOString: desloca o dia)
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const sameDay = (a, b) => dayKey(a) === dayKey(b);

export const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const longDate = (d) =>
  d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^./, (s) => s.toUpperCase());

export const monthLabel = (d) =>
  d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, (s) => s.toUpperCase());

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export const startOfWeek = (d) => startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()));
export const endOfWeek = (d) => endOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + 6));

export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d) => endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));

export const startOfYear = (d) => new Date(d.getFullYear(), 0, 1);
export const endOfYear = (d) => endOfDay(new Date(d.getFullYear(), 11, 31));

export const durationLabel = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}h` : null, m ? `${m}min` : null].filter(Boolean).join(' ') || '0min';
};

// grade do mês: semanas completas (5 ou 6 linhas), começando no domingo
export const monthGrid = (ref) => {
  const first = startOfMonth(ref);
  const diasNoMes = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const semanas = Math.ceil((first.getDay() + diasNoMes) / 7);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: semanas * 7 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );
};
