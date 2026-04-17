import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AlertasController, AlertaFrequencia } from '../../../app/Http/Controllers/alertas/AlertasController';

const FRECUENCIA_OPTIONS: { value: AlertaFrequencia; label: string; desc: string }[] = [
  { value: 'AL_INICIAR', label: 'Al iniciar la app', desc: 'Recibirás alerta cada vez que abras GymSync.' },
  { value: 'ANTES_ENTRENAMIENTO', label: 'Antes de entrenar', desc: 'Alerta cuando abras una reserva o sesión.' },
  { value: 'AMBAS', label: 'Ambas', desc: 'Al iniciar y antes de cada entrenamiento.' },
];

export const AlertasConfigScreen = () => {
  const vm = AlertasController();

  if (vm.isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#f05b22" />
      </View>
    );
  }

  const severidadColor = (sev: string) => {
    if (sev === 'ALTA') return '#ff4444';
    if (sev === 'MEDIA') return '#ffa726';
    return '#66bb6a';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Alertas de Salud</Text>
        <Text style={styles.subtitle}>
          Configura notificaciones automáticas basadas en tus restricciones médicas registradas.
        </Text>

        {/* Global toggle */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <MaterialCommunityIcons name="bell-ring" size={24} color="#f05b22" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.toggleLabel}>Sistema de alertas</Text>
                <Text style={styles.toggleDesc}>
                  {vm.config.globalEnabled ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
            </View>
            <Switch
              value={vm.config.globalEnabled}
              onValueChange={vm.toggleGlobal}
              trackColor={{ false: '#333', true: '#f05b22' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Frecuencia */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frecuencia de alertas</Text>
          {FRECUENCIA_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.freqOption,
                vm.config.frecuencia === opt.value && styles.freqOptionActive,
              ]}
              onPress={() => vm.setFrecuencia(opt.value)}
              activeOpacity={0.7}
            >
              <View style={styles.freqRadio}>
                {vm.config.frecuencia === opt.value && <View style={styles.freqRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.freqLabel}>{opt.label}</Text>
                <Text style={styles.freqDesc}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista de restricciones con toggles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Restricciones detectadas</Text>

          {vm.alertas.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="check-circle" size={48} color="#66bb6a" />
              <Text style={styles.emptyText}>
                No tienes restricciones médicas registradas.
              </Text>
              <Text style={styles.emptySubtext}>
                Agrega restricciones desde la sección de Perfil para activar alertas automáticas.
              </Text>
            </View>
          ) : (
            vm.alertas.map((alerta, idx) => (
              <View key={idx} style={styles.alertaRow}>
                <View style={styles.alertaLeft}>
                  <View
                    style={[
                      styles.severidadDot,
                      { backgroundColor: severidadColor(alerta.severidad) },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertaCondicion}>{alerta.condicion}</Text>
                    <Text style={styles.alertaSeveridad}>
                      Severidad: {alerta.severidad}
                    </Text>
                    {alerta.recomendaciones ? (
                      <Text style={styles.alertaRec} numberOfLines={2}>
                        {alerta.recomendaciones}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Switch
                  value={alerta.enabled}
                  onValueChange={() => vm.toggleAlerta(alerta.condicion)}
                  trackColor={{ false: '#333', true: '#f05b22' }}
                  thumbColor="#fff"
                />
              </View>
            ))
          )}
        </View>

        {/* Vista previa del banner */}
        {vm.alertas.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vista previa</Text>
            <View style={styles.previewBanner}>
              <MaterialCommunityIcons name="alert-circle" size={24} color="#fff" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.previewTitle}>
                  ⚠️ Tienes {vm.alertasActivas.length} restricción(es) activa(s)
                </Text>
                <Text style={styles.previewSub}>
                  {vm.alertasAltas.length > 0
                    ? `${vm.alertasAltas.length} de severidad alta`
                    : 'Recuerda tomar precauciones'}
                </Text>
              </View>
            </View>
            <Text style={styles.previewNote}>
              Esto es lo que verás al abrir la aplicación.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  freqOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#1c1c1e',
    gap: 12,
  },
  freqOptionActive: {
    borderWidth: 1,
    borderColor: '#f05b22',
    backgroundColor: '#f05b2210',
  },
  freqRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  freqRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f05b22',
  },
  freqLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  freqDesc: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  alertaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  alertaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  severidadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  alertaCondicion: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  alertaSeveridad: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  alertaRec: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c62828DD',
    borderRadius: 12,
    padding: 12,
  },
  previewTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  previewSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  previewNote: {
    color: '#666',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
