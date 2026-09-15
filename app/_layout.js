import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { c } from '../lib/theme';
import Login from '../components/Login';

export default function Layout() {
  const [session, setSession] = useState(undefined); // undefined = carregando

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {session === undefined ? (
        <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center' }}>
          <ActivityIndicator color={c.pink} />
        </View>
      ) : session ? (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
      ) : (
        <Login />
      )}
    </SafeAreaProvider>
  );
}
