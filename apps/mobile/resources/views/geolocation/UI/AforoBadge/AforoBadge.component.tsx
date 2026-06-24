import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Aforo } from '@gymsync/core';

type AforoBadgeProps = {
  aforo: Aforo;
  size?: 'small' | 'medium' | 'large';
};

const COLORS: Record<'bajo' | 'medio' | 'alto', { bg: string; text: string }> = {
  bajo: { bg: '#1C1C1E', text: '#00E5A3' },   // Verde Evolución
  medio: { bg: '#1C1C1E', text: '#FF5E00' },     // Naranja Acción
  alto: { bg: '#1C1C1E', text: '#FF453A' },       // Rojo Danger
};

const SIZES = {
  small: { fontSize: 11, paddingH: 8, paddingV: 3 },
  medium: { fontSize: 14, paddingH: 12, paddingV: 5 },
  large: { fontSize: 16, paddingH: 16, paddingV: 7 },
};

export const AforoBadge: React.FC<AforoBadgeProps> = ({
  aforo,
  size = 'medium',
}) => {
  const nivel: 'bajo' | 'medio' | 'alto' = aforo.nivelOcupacion;
  const color = COLORS[nivel];
  const sizeConfig = SIZES[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color.bg,
          paddingHorizontal: sizeConfig.paddingH,
          paddingVertical: sizeConfig.paddingV,
        },
      ]}
      accessibilityLabel={`Aforo: ${aforo.textoFormateado}, ${aforo.porcentajeOcupacion}% ocupado`}
    >
      <View style={[styles.dot, { backgroundColor: color.text }]} />
      <Text style={[styles.text, { color: color.text, fontSize: sizeConfig.fontSize }]}>
        {aforo.textoFormateado}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '700',
  },
});
