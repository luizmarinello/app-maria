import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Empty, Field, Header, Screen } from '../components/ui';
import { clientHistory, listClients, removeClient, saveClient, useData } from '../lib/db';
import { hhmm } from '../lib/date';
import { c, money } from '../lib/theme';

export default function Clientes() {
  const { data, loading, error, reload } = useData(listClients, []);
  const [edit, setEdit] = useState(null);
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(null); // id do cliente com histórico aberto
  const [historico, setHistorico] = useState({});

  const salvar = async () => {
    if (!edit.name.trim()) return Alert.alert('Falta o nome');
    try {
      await saveClient({
        ...(edit.id ? { id: edit.id } : {}),
        name: edit.name.trim(),
        phone: edit.phone?.trim() || null,
        notes: edit.notes?.trim() || null,
      });
      setEdit(null);
      reload();
    } catch (e) {
      Alert.alert('Erro ao salvar', e.message);
    }
  };

  const excluir = (cl) =>
    Alert.alert('Remover cliente?', cl.name + ' será removida. Os agendamentos ficam no histórico.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeClient(cl.id);
            reload();
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);

  const toggle = async (cl) => {
    if (aberto === cl.id) return setAberto(null);
    setAberto(cl.id);
    if (!historico[cl.id]) {
      try {
        const rows = await clientHistory(cl.id);
        setHistorico((h) => ({ ...h, [cl.id]: rows }));
      } catch (e) {
        Alert.alert('Erro', e.message);
      }
    }
  };

  const lista = (data ?? []).filter((x) => x.name.toLowerCase().includes(busca.toLowerCase()));

  return (
    <Screen footer={!edit && <Button label="Nova cliente" icon="add" onPress={() => setEdit({ name: '', phone: '', notes: '' })} />}>
      <Header title="Clientes" subtitle={(data?.length ?? 0) + ' cadastradas'} />

      {edit ? (
        <Card style={{ gap: 12 }}>
          <Field label="Nome" value={edit.name} onChangeText={(t) => setEdit({ ...edit, name: t })} />
          <Field label="Telefone" keyboardType="phone-pad" value={edit.phone ?? ''} onChangeText={(t) => setEdit({ ...edit, phone: t })} />
          <Field label="Observações" multiline value={edit.notes ?? ''} onChangeText={(t) => setEdit({ ...edit, notes: t })} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Button label="Cancelar" variant="soft" onPress={() => setEdit(null)} /></View>
            <View style={{ flex: 1 }}><Button label="Salvar" onPress={salvar} /></View>
          </View>
        </Card>
      ) : (
        <Field label="Buscar" placeholder="Nome da cliente" value={busca} onChangeText={setBusca} />
      )}

      {loading && !data ? (
        <ActivityIndicator color={c.pink} />
      ) : error ? (
        <Card><Text style={{ color: c.red }}>{error}</Text></Card>
      ) : lista.length === 0 ? (
        <Empty text="Nenhuma cliente encontrada" />
      ) : (
        lista.map((cl) => (
          <Card key={cl.id} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable style={{ flex: 1 }} onPress={() => toggle(cl)}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>{cl.name}</Text>
                {!!cl.phone && <Text style={{ color: c.muted, marginTop: 2 }}>{cl.phone}</Text>}
              </Pressable>
              <Pressable onPress={() => setEdit({ id: cl.id, name: cl.name, phone: cl.phone, notes: cl.notes })} hitSlop={10}>
                <Ionicons name="create-outline" size={20} color={c.pink} />
              </Pressable>
              <Pressable onPress={() => excluir(cl)} hitSlop={10}>
                <Ionicons name="trash-outline" size={20} color={c.red} />
              </Pressable>
            </View>

            {aberto === cl.id && (
              <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: 10, gap: 6 }}>
                {!!cl.notes && <Text style={{ color: c.muted }}>{cl.notes}</Text>}
                {!historico[cl.id] ? (
                  <ActivityIndicator color={c.pink} />
                ) : historico[cl.id].length === 0 ? (
                  <Text style={{ color: c.muted }}>Sem atendimentos registrados</Text>
                ) : (
                  historico[cl.id].map((a) => {
                    const d = new Date(a.starts_at);
                    return (
                      <View key={a.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: c.text }}>
                          {d.toLocaleDateString('pt-BR')} {hhmm(d)} · {a.service_name}
                        </Text>
                        <Text style={{ color: a.status === 'concluido' ? c.green : c.muted }}>{money(a.price)}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
