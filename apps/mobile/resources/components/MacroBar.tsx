import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  value: string;
  color: string;
  progress?: number;
};

export const MacroBar: React.FC<Props> = ({ label, value, color, progress = 1 }) => (
  <View style={s.container}>
    <View style={s.header}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, { color }]}>{value}</Text>
    </View>
    <View style={s.track}>
      <View style={[s.fill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const s = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
