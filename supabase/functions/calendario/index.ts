// Calendário assinável (.ics) para o iPhone.
//
// Dois modos:
//  1) GET com Authorization: Bearer <jwt da usuária logada>  -> devolve { url } do calendário
//  2) GET ?token=<CALENDAR_TOKEN>                             -> devolve o .ics (é isso que o Calendário chama)
//
// O token fica em um secret do Supabase, nunca no código do app. Quem tiver a URL vê a agenda,
// então ela deve ser tratada como uma senha.
//
// Deploy: npx supabase functions deploy calendario --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TOKEN = Deno.env.get('CALENDAR_TOKEN') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!TOKEN) return json({ error: 'CALENDAR_TOKEN não configurado' }, 500);

  const url = new URL(req.url);

  // Modo 1: app logado pede a URL do calendário
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data, error } = await user.auth.getUser();
    if (error || !data.user) return json({ error: 'não autorizado' }, 401);
    const webcal = `webcal://${url.host}${url.pathname}?token=${TOKEN}`;
    return json({ url: webcal, https: webcal.replace('webcal://', 'https://') });
  }

  // Modo 2: o Calendário busca o .ics com o token
  if (url.searchParams.get('token') !== TOKEN) return json({ error: 'não autorizado' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const to = new Date();
  to.setDate(to.getDate() + 180);

  const { data: rows, error } = await admin
    .from('appointments')
    .select('id, client_name, service_name, starts_at, duration_min, price, status, created_at')
    .gte('starts_at', from.toISOString())
    .lte('starts_at', to.toISOString())
    .in('status', ['agendado', 'concluido', 'bloqueio'])
    .order('starts_at');
  if (error) return json({ error: error.message }, 500);

  const now = new Date();
  const events = (rows ?? []).map((a) => {
    const start = new Date(a.starts_at);
    const end = new Date(start.getTime() + a.duration_min * 60000);
    const bloqueio = a.status === 'bloqueio';
    const title = bloqueio ? `🔒 ${a.service_name}` : `${a.client_name} · ${a.service_name}`;
    const desc = bloqueio ? 'Horário bloqueado' : `${brl(a.price)}\nStatus: ${a.status}`;
    const alarm =
      a.status === 'agendado' && start > now
        ? ['BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'END:VALARM']
        : [];
    return [
      'BEGIN:VEVENT',
      `UID:${a.id}@minha-agenda`,
      `DTSTAMP:${stamp(new Date(a.created_at))}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(desc)}`,
      'TRANSP:OPAQUE',
      ...alarm,
      'END:VEVENT',
    ].join('\r\n');
  });

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Minha Agenda//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Minha Agenda',
    'X-WR-TIMEZONE:America/Sao_Paulo',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  return new Response(ics, {
    headers: {
      ...cors,
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
});

// Datas em UTC (sufixo Z): o Calendário converte para o fuso do aparelho.
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

// Texto em .ics: escapa vírgula, ponto e vírgula e barra; quebra de linha vira \n literal.
const esc = (s: string) => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');

const brl = (n: number) =>
  'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
