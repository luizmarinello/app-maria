import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { c, card } from '../lib/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const entrar = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError('E-mail ou senha incorretos.');
    setBusy(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 30, fontWeight: '700', color: c.text }}>Sua agenda</Text>
      <Text style={{ color: c.muted, marginBottom: 24 }}>Entre para ver seus agendamentos</Text>

      <View style={[card, { gap: 12 }]}>
        <TextInput
          placeholder="E-mail"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={input}
        />
        <TextInput
          placeholder="Senha"
          placeholderTextColor={c.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={input}
        />
        {error && <Text style={{ color: c.red }}>{error}</Text>}
        <Pressable
          onPress={entrar}
          disabled={busy || !email || !password}
          style={{
            backgroundColor: busy || !email || !password ? c.pinkSoft : c.pink,
            borderRadius: 14,
            padding: 16,
            alignItems: 'center',
          }}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Entrar</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const input = {
  borderWidth: 1,
  borderColor: c.line,
  borderRadius: 12,
  padding: 14,
  color: c.text,
  fontSize: 16,
};
