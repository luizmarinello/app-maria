import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from './supabase';

const ok = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

// ---- serviços ----
export const listServices = () =>
  supabase.from('services').select('*').eq('active', true).order('name').then(ok);

export const saveService = (s) =>
  supabase.from('services').upsert({ ...s, active: true }).select().then(ok);

export const removeService = (id) =>
  supabase.from('services').update({ active: false }).eq('id', id).then(ok);

// ---- clientes ----
export const listClients = () =>
  supabase.from('clients').select('*').order('name').then(ok);

export const saveClient = (cl) => supabase.from('clients').upsert(cl).select().single().then(ok);

export const removeClient = (id) => supabase.from('clients').delete().eq('id', id).then(ok);

// ---- agendamentos ----
export const listAppointments = (from, to) =>
  supabase
    .from('appointments')
    .select('*')
    .gte('starts_at', from.toISOString())
    .lte('starts_at', to.toISOString())
    .neq('status', 'cancelado')
    .order('starts_at')
    .then(ok);

export const clientHistory = (clientId) =>
  supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('starts_at', { ascending: false })
    .limit(20)
    .then(ok);

export const saveAppointment = (a) => supabase.from('appointments').upsert(a).select().then(ok);

export const setStatus = (id, status) =>
  supabase.from('appointments').update({ status }).eq('id', id).then(ok);

export const removeAppointment = (id) => supabase.from('appointments').delete().eq('id', id).then(ok);

export const counters = async () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start.getTime() + 86400000 - 1);
  const weekEnd = new Date(start.getTime() + 7 * 86400000);

  const [hoje, concluidos, semana] = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true })
      .gte('starts_at', start.toISOString()).lte('starts_at', end.toISOString())
      .eq('status', 'agendado'),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'concluido'),
    supabase.from('appointments').select('id', { count: 'exact', head: true })
      .gte('starts_at', start.toISOString()).lt('starts_at', weekEnd.toISOString())
      .neq('status', 'cancelado'),
  ]);
  const err = hoje.error || concluidos.error || semana.error;
  if (err) throw new Error(err.message);
  return { hoje: hoje.count ?? 0, concluidos: concluidos.count ?? 0, semana: semana.count ?? 0 };
};

/** Busca dados ao abrir/voltar para a tela. */
export function useData(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const run = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    Promise.resolve(fetcher())
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((e) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => { alive = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(run);
  return { ...state, reload: run };
}
