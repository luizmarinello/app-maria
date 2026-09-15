// Rode com: node lib/report.test.mjs
import assert from 'node:assert/strict';
import { daysSince, lastVisits, overlaps, summarize } from './report.mjs';

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
assert.equal(r.pending, 180); // só o agendado, cancelado fica fora
assert.equal(r.pendingCount, 1);
assert.equal(r.ticket, 88.33);
assert.equal(r.services, 2);
assert.deepEqual(r.byService.map((s) => s.name), ['Manutenção', 'Banho de Gel']);
assert.equal(r.byService[0].total, 180);
assert.equal(r.byService[0].count, 2);
assert.deepEqual(r.byDay, [
  { day: '2026-09-11', total: 85 },
  { day: '2026-09-14', total: 180 },
]);

// vários serviços num atendimento: o total vem do preço do atendimento,
// mas o detalhamento abre por item
const multi = summarize([
  { service_name: 'Manutenção + Spa dos pés', price: 160, status: 'concluido', starts_at: '2026-09-14T13:00:00',
    items: [{ name: 'Manutenção', price: 90 }, { name: 'Spa dos pés', price: 70 }] },
]);
assert.equal(multi.total, 160);
assert.equal(multi.count, 1);
assert.deepEqual(multi.byService.map((s) => [s.name, s.total]), [['Manutenção', 90], ['Spa dos pés', 70]]);

// bloqueios não entram em nada
assert.equal(summarize([{ service_name: 'Almoço', price: 0, status: 'bloqueio', starts_at: '2026-09-14T12:00:00' }]).count, 0);

// preço como string (vem assim do Postgres numeric)
assert.equal(summarize([a('X', '99.50', 'concluido', '2026-09-01T10:00:00')]).total, 99.5);
assert.equal(summarize([]).ticket, 0);

// conflito de horário: [13:00,14:30) x [14:00,15:00) sim; [14:30,15:30) não (encosta, não sobrepõe)
const t = (h, m = 0) => new Date(2026, 8, 15, h, m);
assert.equal(overlaps(t(13), t(14, 30), t(14), t(15)), true);
assert.equal(overlaps(t(13), t(14, 30), t(14, 30), t(15, 30)), false);
assert.equal(overlaps(t(13), t(14, 30), t(12), t(13)), false);

// última visita por cliente ignora agendados e pega a mais recente
const v = lastVisits([
  { client_id: 'c1', status: 'concluido', starts_at: '2026-09-01T10:00:00' },
  { client_id: 'c1', status: 'concluido', starts_at: '2026-09-10T10:00:00' },
  { client_id: 'c1', status: 'agendado', starts_at: '2026-09-20T10:00:00' },
  { client_id: 'c2', status: 'cancelado', starts_at: '2026-09-05T10:00:00' },
]);
assert.equal(v.c1.getDate(), 10);
assert.equal(v.c2, undefined);
assert.equal(daysSince(new Date(2026, 8, 1), new Date(2026, 8, 15)), 14);

console.log('ok');
