// Rode com: node lib/report.test.mjs
import assert from 'node:assert/strict';
import { summarize } from './report.mjs';

const a = (service, price, status, iso) => ({ service_name: service, price, status, starts_at: iso });

const r = summarize([
  a('Manutenção', 90, 'concluido', '2026-09-14T13:00:00'),
  a('Manutenção', 90, 'concluido', '2026-09-14T16:00:00'),
  a('Banho de Gel', 85, 'concluido', '2026-09-11T10:00:00'),
  a('Alongamento em Gel', 180, 'agendado', '2026-09-20T10:00:00'), // não entra
  a('Curso', 1000, 'cancelado', '2026-09-05T09:00:00'), // não entra
]);

assert.equal(r.count, 3);
assert.equal(r.total, 265);
assert.equal(r.ticket, 88.33);
assert.equal(r.services, 2);
assert.deepEqual(r.byService.map((s) => s.name), ['Manutenção', 'Banho de Gel']);
assert.equal(r.byService[0].total, 180);
assert.equal(r.byService[0].count, 2);
assert.deepEqual(r.byDay, [
  { day: '2026-09-11', total: 85 },
  { day: '2026-09-14', total: 180 },
]);

// preço como string (vem assim do Postgres numeric)
assert.equal(summarize([a('X', '99.50', 'concluido', '2026-09-01T10:00:00')]).total, 99.5);
assert.equal(summarize([]).ticket, 0);

console.log('ok');
