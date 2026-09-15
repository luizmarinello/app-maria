import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { c } from '../lib/theme';
import { WEEKDAYS, dayKey, monthGrid, monthLabel } from '../lib/date';

export default function MonthCalendar({ month, selected, marked, onSelect, onMonthChange }) {
  const days = monthGrid(month);
  const selKey = dayKey(selected);
  const todayKey = dayKey(new Date());

  const step = (n) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: c.text }}>
          {monthLabel(month)}
        </Text>
        <Pressable onPress={() => step(-1)} hitSlop={12} style={{ paddingHorizontal: 8 }}>
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <Pressable onPress={() => step(1)} hitSlop={12} style={{ paddingHorizontal: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={c.text} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={{ flex: 1, textAlign: 'center', color: c.muted, fontSize: 12, marginBottom: 6 }}>
            {w}
          </Text>
        ))}
      </View>

      {[0, 1, 2, 3, 4, 5].map((row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {days.slice(row * 7, row * 7 + 7).map((d) => {
            const k = dayKey(d);
            const outside = d.getMonth() !== month.getMonth();
            const isSel = k === selKey;
            return (
              <Pressable
                key={k}
                onPress={() => onSelect(d)}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSel ? c.pink : 'transparent',
                  }}>
                  <Text
                    style={{
                      color: isSel ? '#fff' : outside ? c.line : k === todayKey ? c.pink : c.text,
                      fontWeight: isSel || k === todayKey ? '700' : '400',
                    }}>
                    {d.getDate()}
                  </Text>
                </View>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    marginTop: 2,
                    backgroundColor: marked.has(k) && !isSel ? c.pink : 'transparent',
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
