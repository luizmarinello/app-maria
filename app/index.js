import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MonthCalendar from '../components/MonthCalendar';
import { Button, Card, Empty, Header, Screen, Stat } from '../components/ui';
import { counters, listAppointments, useData } from '../lib/db';
import { dayKey, durationLabel, endOfMonth, hhmm, longDate, startOfMonth } from '../lib/date';
import { c, money } from '../lib/theme';

export default function Home() {
  const router = useRouter();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const stats = useData(counters, []);
  const monthData = useData(
    () => listAppointments(startOfMonth(month), endOfMonth(month)),
    [month.getTime()]
  );

  const items = monthData.data ?? [];
  const marked = new Set(items.map((a) => dayKey(new Date(a.starts_at))));
  const selKey = dayKey(selected);
  const ofDay = items.filter((a) => dayKey(new Date(a.starts_at)) === selKey);

  return (
    <Screen
      footer={
        <Button
          label="Novo Agendamento"
          icon="add"
          onPress={() => router.push({ pathname: '/agendamento', params: { date: selKey } })}
        />
      }>
      <Header
        title="Sua agenda"
        subtitle="Agendamentos e faturamento"
        right={
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Pressable onPress={() => router.push('/clientes')} hitSlop={8}>
              <Ionicons name="people-outline" size={22} color={c.text} />
            </Pressable>
            <Pressable onPress={() => router.push('/financeiro')} hitSlop={8}>
              <Ionicons name="stats-chart-outline" size={22} color={c.text} />
            </Pressable>
            <Pressable onPress={() => router.push('/configuracoes')} hitSlop={8}>
              <Ionicons name="settings-outline" size={22} color={c.text} />
            </Pressable>
          </View>
        }
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat icon="calendar-outline" value={stats.data?.hoje ?? '–'} label="Hoje" />
        <Stat icon="checkmark-circle-outline" value={stats.data?.concluidos ?? '–'} label="Concluídos" color={c.green} />
        <Stat icon="calendar-outline" value={stats.data?.semana ?? '–'} label="Esta Semana" />
      </View>

      <View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>{longDate(selected)}</Text>
        <Text style={{ color: c.muted }}>
          {ofDay.length} {ofDay.length === 1 ? 'agendamento' : 'agendamentos'}
        </Text>
      </View>

      {monthData.loading && !monthData.data ? (
        <ActivityIndicator color={c.pink} />
      ) : monthData.error ? (
        <Card>
          <Text style={{ color: c.red }}>{monthData.error}</Text>
        </Card>
      ) : ofDay.length === 0 ? (
        <Empty text="Nenhum agendamento para este dia" />
      ) : (
        ofDay.map((a) => <AppointmentRow key={a.id} a={a} onPress={() => router.push(`/agendamento?id=${a.id}`)} />)
      )}

      <MonthCalendar
        month={month}
        selected={selected}
        marked={marked}
        onSelect={setSelected}
        onMonthChange={(m) => {
          setMonth(m);
          setSelected(m);
        }}
      />
    </Screen>
  );
}

function AppointmentRow({ a, onPress }) {
  const done = a.status === 'concluido';
  return (
    <Pressable onPress={onPress}>
      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: c.pinkSoft,
              alignItems: 'center', justifyContent: 'center',
            }}>
            <Text style={{ color: c.pink, fontWeight: '700' }}>{a.client_name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: c.text }}>{a.client_name}</Text>
            <Text style={{ color: c.muted, marginTop: 2 }}>
              {hhmm(new Date(a.starts_at))} • {durationLabel(a.duration_min)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Tag text={a.service_name} bg={c.bg} fg={c.muted} />
          <Text style={{ color: c.green, fontWeight: '600', flex: 1, textAlign: 'right' }}>{money(a.price)}</Text>
          <Tag
            text={done ? 'Concluído' : 'Agendado'}
            bg={done ? c.greenSoft : c.pinkSoft}
            fg={done ? c.green : c.pink}
          />
        </View>
      </Card>
    </Pressable>
  );
}

function Tag({ text, bg, fg }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 }}>
      <Text style={{ color: fg, fontSize: 13 }}>{text}</Text>
    </View>
  );
}
