import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  accent?: string;
};

export const ParameterChip: React.FC<Props> = ({ icon, value, accent = '#FF5E00' }) => (
  <View style={s.chip}>
    <MaterialCommunityIcons name={icon} size={13} color={accent} />
    <Text style={s.text}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  text: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '700',
  },
});
