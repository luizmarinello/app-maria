import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Entrar from './components/Entrar';
import Tabs from './components/Tabs';
import { Skeleton } from './components/ui';
import { supabase } from './lib/supabase';
import Agenda from './pages/Agenda';
import Agendamento from './pages/Agendamento';
import Ajustes from './pages/Ajustes';
import Clientes from './pages/Clientes';
import Financeiro from './pages/Financeiro';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = ainda verificando

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <main className="screen">
        <Skeleton rows={3} height={90} />
      </main>
    );
  }

  if (!session) return <Entrar />;

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Tabs />}>
          <Route path="/" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/ajustes" element={<Ajustes />} />
        </Route>
        <Route path="/agendamento/:id" element={<Agendamento />} />
      </Routes>
    </BrowserRouter>
  );
}
