/** Consolida faturamento. Só concluídos contam; agendados entram como "previsto". */
export function summarize(appointments) {
  const all = appointments ?? [];
  const done = all.filter((a) => a.status === 'concluido');
  const pending = all.filter((a) => a.status === 'agendado');

  const total = done.reduce((sum, a) => sum + Number(a.price || 0), 0);
  const byService = new Map();
  const byDay = new Map();

  for (const a of done) {
    const s = byService.get(a.service_name) ?? { name: a.service_name, total: 0, count: 0 };
    s.total += Number(a.price || 0);
    s.count += 1;
    byService.set(a.service_name, s);

    const d = new Date(a.starts_at);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    byDay.set(key, (byDay.get(key) ?? 0) + Number(a.price || 0));
  }

  return {
    total: round2(total),
    pending: round2(pending.reduce((sum, a) => sum + Number(a.price || 0), 0)),
    pendingCount: pending.length,
    count: done.length,
    ticket: done.length ? round2(total / done.length) : 0,
    services: byService.size,
    byService: [...byService.values()].map((s) => ({ ...s, total: round2(s.total) })).sort((a, b) => b.total - a.total),
    byDay: [...byDay.entries()].map(([day, total]) => ({ day, total: round2(total) })).sort((a, b) => a.day.localeCompare(b.day)),
  };
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Dois intervalos [inicio, fim) se sobrepõem? */
export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

/** Última visita concluída por cliente: { [client_id]: Date } */
export function lastVisits(appointments) {
  const out = {};
  for (const a of appointments ?? []) {
    if (a.status !== 'concluido' || !a.client_id) continue;
    const d = new Date(a.starts_at);
    if (!out[a.client_id] || d > out[a.client_id]) out[a.client_id] = d;
  }
  return out;
}

export const daysSince = (date, now = new Date()) =>
  Math.floor((now - date) / 86400000);
