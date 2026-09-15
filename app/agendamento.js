import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Chips, Field, Header, Screen } from '../components/ui';
import { supabase } from '../lib/supabase';
import { listClients, listServices, removeAppointment, saveAppointment, saveClient, setStatus } from '../lib/db';
import { durationLabel, hhmm } from '../lib/date';
import { c, money } from '../lib/theme';

export default function Agendamento() {
  const router = useRouter();
  const { id, date } = useLocalSearchParams();

  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState(null); // 'date' | 'time'

  const [form, setForm] = useState(() => {
    const base = date ? new Date(date + 'T09:00:00') : new Date();
    base.setMinutes(0, 0, 0);
    return {
      clientName: '',
      clientId: null,
      serviceId: null,
      serviceName: '',
      when: base,
      duration: 60,
      price: '0',
      status: 'agendado',
    };
  });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    (async () => {
      try {
        const [srv, cli] = await Promise.all([listServices(), listClients()]);
        setServices(srv);
        setClients(cli);
        if (id) {
          const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single();
          if (error) throw new Error(error.message);
          set({
            clientName: data.client_name,
            clientId: data.client_id,
            serviceId: data.service_id,
            serviceName: data.service_name,
            when: new Date(data.starts_at),
            duration: data.duration_min,
            price: String(data.price),
            status: data.status,
          });
        }
      } catch (e) {
        Alert.alert('Erro', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const pickService = (sid) => {
    const s = services.find((x) => x.id === sid);
    if (!s) return;
    set({ serviceId: s.id, serviceName: s.name, duration: s.duration_min, price: String(s.price) });
  };

  const salvar = async () => {
    const name = form.clientName.trim();
    const price = Number(String(form.price).replace(',', '.'));
    if (!name) return Alert.alert('Falta o nome', 'Informe a cliente.');
    if (!form.serviceId) return Alert.alert('Falta o serviço', 'Escolha um serviço.');
    if (!Number.isFinite(price) || price < 0) return Alert.alert('Valor inválido', 'Confira o valor.');

    setSaving(true);
    try {
      let clientId = form.clientId;
      const known = clients.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (!clientId && known) clientId = known.id;
      if (!clientId) clientId = (await saveClient({ name })).id;

      await saveAppointment({
        ...(id ? { id } : {}),
        client_id: clientId,
        client_name: name,
        service_id: form.serviceId,
        service_name: form.serviceName,
        starts_at: form.when.toISOString(),
        duration_min: form.duration,
        price,
        status: form.status,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSaving(false);
    }
  };

  const excluir = () =>
    Alert.alert('Excluir agendamento?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeAppointment(id);
            router.back();
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);

  const concluir = async () => {
    try {
      await setStatus(id, 'concluido');
      set({ status: 'concluido' });
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title={id ? 'Agendamento' : 'Novo agendamento'} />
        <ActivityIndicator color={c.pink} />
      </Screen>
    );
  }

  const sugestoes =
    form.clientName.length >= 2 && !form.clientId
      ? clients.filter((x) => x.name.toLowerCase().includes(form.clientName.toLowerCase())).slice(0, 4)
      : [];

  return (
    <Screen
      footer={
        <Button label={saving ? 'Salvando...' : 'Salvar'} icon="checkmark" onPress={salvar} disabled={saving} />
      }>
      <Header title={id ? 'Agendamento' : 'Novo agendamento'} subtitle={form.serviceName || 'Preencha os dados'} />

      <Card style={{ gap: 14 }}>
        <Field
          label="Cliente"
          placeholder="Nome da cliente"
          value={form.clientName}
          onChangeText={(t) => set({ clientName: t, clientId: null })}
        />
        {sugestoes.map((s) => (
          <Pressable key={s.id} onPress={() => set({ clientName: s.name, clientId: s.id })}>
            <Text style={{ color: c.pink, paddingVertical: 4 }}>{s.name}</Text>
          </Pressable>
        ))}

        <View style={{ gap: 6 }}>
          <Text style={{ color: c.muted, fontSize: 13 }}>Serviço</Text>
          {services.length === 0 ? (
            <Text style={{ color: c.muted }}>Cadastre um serviço em Configurações primeiro.</Text>
          ) : (
            <Chips
              options={services.map((s) => ({ value: s.id, label: s.name }))}
              value={form.serviceId}
              onChange={pickService}
            />
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={() => setPicker('date')} style={{ flex: 1 }}>
            <Text style={{ color: c.muted, fontSize: 13, marginBottom: 6 }}>Data</Text>
            <Text style={box}>{form.when.toLocaleDateString('pt-BR')}</Text>
          </Pressable>
          <Pressable onPress={() => setPicker('time')} style={{ flex: 1 }}>
            <Text style={{ color: c.muted, fontSize: 13, marginBottom: 6 }}>Hora</Text>
            <Text style={box}>{hhmm(form.when)}</Text>
          </Pressable>
        </View>

        {picker && (
          <DateTimePicker
            value={form.when}
            mode={picker}
            is24Hour
            onChange={(e, d) => {
              setPicker(null);
              if (e.type !== 'dismissed' && d) set({ when: d });
            }}
          />
        )}

        <Field label="Valor (R$)" keyboardType="decimal-pad" value={form.price} onChangeText={(t) => set({ price: t })} />
        <Text style={{ color: c.muted }}>
          Duração: {durationLabel(form.duration)} • Total: {money(String(form.price).replace(',', '.'))}
        </Text>
      </Card>

      {!!id && (
        <View style={{ gap: 12 }}>
          {form.status !== 'concluido' && (
            <Button label="Marcar como concluído" icon="checkmark-circle" variant="soft" onPress={concluir} />
          )}
          <Button label="Excluir" icon="trash-outline" variant="danger" onPress={excluir} />
        </View>
      )}
    </Screen>
  );
}

const box = {
  borderWidth: 1,
  borderColor: c.line,
  borderRadius: 12,
  padding: 14,
  color: c.text,
  fontSize: 16,
};
