import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AlertasController } from '../../../app/Http/Controllers/alertas/AlertasController';

/**
 * AlertaBanner — Banner que aparece en la pantalla de Inicio
 * cuando el usuario tiene restricciones médicas activas.
 */
export const AlertaBanner = () => {
  const { alertasActivas, alertasAltas, alertasMedias, shouldShowBanner, dismissBanner, isLoading } =
    AlertasController();

  if (isLoading || !shouldShowBanner) return null;

  const hasAltas = alertasAltas.length > 0;
  const bannerColor = hasAltas ? '#c62828' : '#e65100';
  const bannerIcon = hasAltas ? 'alert-circle' : 'alert';

  const firstAlta = alertasAltas[0];
  const mainMessage = hasAltas
    ? `⚠️ ${firstAlta.condicion}: ${firstAlta.recomendaciones || 'Precaución extrema requerida'}`
    : `Tienes ${alertasActivas.length} restricción(es) médica(s) activa(s).`;

  const subMessage = hasAltas
    ? `${alertasAltas.length} de severidad alta detectada(s).`
    : 'Recuerda tomar precauciones.';

  return (
    <View style={[styles.banner, { backgroundColor: bannerColor + 'DD' }]}>
      <View style={styles.bannerContent}>
        <MaterialCommunityIcons name={bannerIcon as any} size={28} color="#fff" />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>{mainMessage}</Text>
          <Text style={styles.bannerSub}>{subMessage}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={dismissBanner} style={styles.dismissBtn}>
        <MaterialCommunityIcons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
