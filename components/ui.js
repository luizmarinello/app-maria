import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { c, card } from '../lib/theme';

export function Screen({ children, footer }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 16 }}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? (
        <View style={{ padding: 20, paddingBottom: insets.bottom + 12 }}>{footer}</View>
      ) : null}
    </View>
  );
}

export function Header({ title, subtitle, right }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {router.canGoBack() && (
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: c.text }}>{title}</Text>
        {!!subtitle && <Text style={{ color: c.muted, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[card, style]}>{children}</View>;
}

export function Stat({ icon, value, label, color = c.pink }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: c.text }}>{value}</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: 13 }}>{label}</Text>
    </Card>
  );
}

export function Button({ label, onPress, icon, variant = 'primary', disabled }) {
  const bg = { primary: c.pink, soft: c.pinkSoft, danger: c.red, ghost: 'transparent' }[variant];
  const fg = variant === 'soft' ? c.pink : variant === 'ghost' ? c.muted : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? c.line : bg,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
      }}>
      {!!icon && <Ionicons name={icon} size={18} color={fg} />}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.muted, fontSize: 13 }}>{label}</Text>
      <TextInput
        placeholderTextColor={c.muted}
        {...props}
        style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 14, color: c.text, fontSize: 16 }}
      />
    </View>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={{
              backgroundColor: on ? c.pink : c.pinkSoft,
              borderRadius: 999,
              paddingVertical: 8,
              paddingHorizontal: 14,
            }}>
            <Text style={{ color: on ? '#fff' : c.pink, fontWeight: '600' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Empty({ text }) {
  return <Text style={{ color: c.muted, textAlign: 'center', paddingVertical: 28 }}>{text}</Text>;
}
