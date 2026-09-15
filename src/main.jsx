import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Tabs from './components/Tabs';
import Agenda from './pages/Agenda';
import Agendamento from './pages/Agendamento';
import Ajustes from './pages/Ajustes';
import Clientes from './pages/Clientes';
import Financeiro from './pages/Financeiro';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
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
  </StrictMode>
);
