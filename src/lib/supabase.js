import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

if (!url || !key) {
  throw new Error('Faltam VITE_SUPABASE_URL e VITE_SUPABASE_KEY no arquivo .env (copie de .env.example).');
}

// A sessão fica no localStorage e renova sozinha: a senha é pedida uma vez só.
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
