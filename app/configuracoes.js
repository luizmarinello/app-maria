import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Empty, Field, Header, Screen } from '../components/ui';
import { listServices, removeService, saveService, useData } from '../lib/db';
import { supabase } from '../lib/supabase';
import { durationLabel } from '../lib/date';
import { c, money } from '../lib/theme';

const empty = { name: '', duration: '60', price: '' };

export default function Configuracoes() {
  const { data, loading, error, reload } = useData(listServices, []);
  const [edit, setEdit] = useState(null); // {id?, name, duration, price}

  const salvar = async () => {
    const price = Number(String(edit.price).replace(',', '.'));
    const duration = parseInt(edit.duration, 10);
    if (!edit.name.trim()) return Alert.alert('Falta o nome do serviço');
    if (!Number.isInteger(duration) || duration <= 0) return Alert.alert('Duração inválida', 'Informe em minutos.');
    if (!Number.isFinite(price) || price < 0) return Alert.alert('Valor inválido');

    try {
      await saveService({
        ...(edit.id ? { id: edit.id } : {}),
        name: edit.name.trim(),
        duration_min: duration,
        price,
      });
      setEdit(null);
      reload();
    } catch (e) {
      Alert.alert('Erro ao salvar', e.message);
    }
  };

  const excluir = (s) =>
    Alert.alert('Remover serviço?', s.name + ' sai da lista. Os agendamentos antigos continuam com o histórico.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeService(s.id);
            reload();
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);

  return (
    <Screen>
      <Header
        title="Configurações"
        subtitle="Gerencie seus serviços"
        right={
          !edit && (
            <Pressable
              onPress={() => setEdit({ ...empty })}
              style={{ backgroundColor: c.pink, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700' }}>Novo</Text>
            </Pressable>
          )
        }
      />

      {edit && (
        <Card style={{ gap: 12 }}>
          <Field label="Nome" value={edit.name} onChangeText={(t) => setEdit({ ...edit, name: t })} placeholder="Ex.: Manutenção" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Duração (min)" keyboardType="number-pad" value={String(edit.duration)} onChangeText={(t) => setEdit({ ...edit, duration: t })} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Valor (R$)" keyboardType="decimal-pad" value={String(edit.price)} onChangeText={(t) => setEdit({ ...edit, price: t })} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancelar" variant="soft" onPress={() => setEdit(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Salvar" onPress={salvar} />
            </View>
          </View>
        </Card>
      )}

      {loading && !data ? (
        <ActivityIndicator color={c.pink} />
      ) : error ? (
        <Card><Text style={{ color: c.red }}>{error}</Text></Card>
      ) : data.length === 0 ? (
        <Empty text="Nenhum serviço cadastrado" />
      ) : (
        data.map((s) => (
          <Card key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>{s.name}</Text>
              <Text style={{ color: c.pink, marginTop: 4 }}>
                {durationLabel(s.duration_min)} • {money(s.price)}
              </Text>
            </View>
            <Pressable onPress={() => setEdit({ id: s.id, name: s.name, duration: String(s.duration_min), price: String(s.price) })} hitSlop={10}>
              <Ionicons name="create-outline" size={20} color={c.pink} />
            </Pressable>
            <Pressable onPress={() => excluir(s)} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={c.red} />
            </Pressable>
          </Card>
        ))
      )}

      <Button label="Sair da conta" variant="ghost" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}
