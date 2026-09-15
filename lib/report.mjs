/** Consolida faturamento. Considera apenas atendimentos concluídos. */
export function summarize(appointments) {
  const done = (appointments ?? []).filter((a) => a.status === 'concluido');

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
    count: done.length,
    ticket: done.length ? round2(total / done.length) : 0,
    services: byService.size,
    byService: [...byService.values()].map((s) => ({ ...s, total: round2(s.total) })).sort((a, b) => b.total - a.total),
    byDay: [...byDay.entries()].map(([day, total]) => ({ day, total: round2(total) })).sort((a, b) => a.day.localeCompare(b.day)),
  };
}

const round2 = (n) => Math.round(n * 100) / 100;
