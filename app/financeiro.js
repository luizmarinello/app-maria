import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Card, Chips, Empty, Header, Screen, Stat } from '../components/ui';
import { listAppointments, useData } from '../lib/db';
import { summarize } from '../lib/report.mjs';
import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from '../lib/date';
import { c, money } from '../lib/theme';

const periods = {
  semana: { label: 'Esta Semana', range: (d) => [startOfWeek(d), endOfWeek(d)] },
  mes: { label: 'Este Mês', range: (d) => [startOfMonth(d), endOfMonth(d)] },
  ano: { label: 'Este Ano', range: (d) => [startOfYear(d), endOfYear(d)] },
};

export default function Financeiro() {
  const [period, setPeriod] = useState('mes');
  const [from, to] = periods[period].range(new Date());
  const { data, loading, error } = useData(() => listAppointments(from, to), [period]);

  const r = summarize(data ?? []);
  const maxDay = Math.max(1, ...r.byDay.map((d) => d.total));

  return (
    <Screen>
      <Header title="Relatório Financeiro" subtitle="Análise de faturamento" />

      <Chips
        options={Object.entries(periods).map(([value, p]) => ({ value, label: p.label }))}
        value={period}
        onChange={setPeriod}
      />

      {loading && !data ? (
        <ActivityIndicator color={c.pink} />
      ) : error ? (
        <Card><Text style={{ color: c.red }}>{error}</Text></Card>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat icon="cash-outline" value={money(r.total)} label="Faturamento" color={c.green} />
            <Stat icon="trending-up-outline" value={money(r.ticket)} label="Ticket médio" />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat icon="checkmark-done-outline" value={r.count} label="Atendimentos" />
            <Stat icon="pricetags-outline" value={r.services} label="Serviços" />
          </View>
          <Text style={{ color: c.muted, fontSize: 12 }}>
            Considera apenas atendimentos marcados como concluídos.
          </Text>

          {r.byDay.length === 0 ? (
            <Empty text="Nenhum atendimento concluído no período" />
          ) : (
            <>
              <Card style={{ gap: 12 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: c.text }}>Faturamento por dia</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 120 }}>
                  {r.byDay.map((d) => (
                    <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                      <View
                        style={{
                          width: '100%',
                          height: Math.max(3, (d.total / maxDay) * 96),
                          backgroundColor: c.pink,
                          borderRadius: 4,
                        }}
                      />
                      <Text style={{ color: c.muted, fontSize: 10 }}>{d.day.slice(8)}</Text>
                    </View>
                  ))}
                </View>
              </Card>

              <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }}>Detalhamento por Serviço</Text>
              {r.byService.map((s) => (
                <Card key={s.name} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: c.pink, marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: c.text }}>{s.name}</Text>
                    <Text style={{ color: c.muted, fontSize: 13 }}>
                      {s.count} {s.count === 1 ? 'atendimento' : 'atendimentos'}
                    </Text>
                  </View>
                  <Text style={{ color: c.pink, fontWeight: '700', fontSize: 17 }}>{money(s.total)}</Text>
                </Card>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
