import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Field, Notice } from './ui';

export default function Entrar() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState(null);

  const entrar = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) setErro('E-mail ou senha incorretos.');
    setBusy(false);
  };

  return (
    <form className="screen" onSubmit={entrar} style={{ justifyContent: 'center', minHeight: '100dvh' }}>
      <div>
        <h1 className="t-large">Sua agenda</h1>
        <p className="t-foot">Entre uma vez. O aparelho fica lembrado.</p>
      </div>

      <div className="group">
        <Field
          label="E-mail"
          type="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      {erro && <Notice>{erro}</Notice>}

      <Button type="submit" disabled={busy || !email || !senha}>
        {busy ? 'Entrando' : 'Entrar'}
      </Button>
    </form>
  );
}
