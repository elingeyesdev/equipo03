import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, ClientProfile } from '../../../app/Providers/staff/api/staff.api';
import { DB_ROLES } from '../../../app/constants/db-roles';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';

type RouteParams = { clientId: number; clientName: string };

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

const bmiLabel = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Bajo peso',   color: '#38BDF8' };
  if (bmi < 25)   return { label: 'Normal',       color: '#22c55e' };
  if (bmi < 30)   return { label: 'Sobrepeso',    color: '#facc15' };
  return              { label: 'Obesidad',      color: '#f05b22' };
};

// ─── Metric Card ─────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, unit, icon }: {
  label: string; value: string | number | null; unit?: string; icon: string;
}) => (
  <View style={s.metricCard}>
    <MaterialCommunityIcons name={icon as any} size={20} color="#f05b22" style={s.metricIcon} />
    <Text style={s.metricLabel}>{label}</Text>
    <Text style={s.metricValue}>
      {value != null ? `${value}${unit ? ' ' + unit : ''}` : '—'}
    </Text>
  </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }: {
  icon: string; label: string; value: string | null;
}) => (
  <View style={s.infoRow}>
    <MaterialCommunityIcons name={icon as any} size={16} color="#9CA3AF" />
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value ?? '—'}</Text>
  </View>
);

export const PerfilAlumnoScreen = () => {
  const { user }    = useAuth();
  const navigation  = useNavigation<any>();
  const route       = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { clientId, clientName } = route.params;
  const myRoleId = (user as any)?.roleId as number | undefined;
  const myLevel  = (user as any)?.level ?? 0;
  // Both action buttons are available for any trainer/nutritionist (level 3).
  // roleId check covers new sessions; level fallback covers old cached sessions.
  const isStaff3 = myLevel === 3
    || myRoleId === DB_ROLES.ENTRENADOR
    || myRoleId === DB_ROLES.NUTRICIONISTA;
  const showRutinaBtn = isStaff3;
  const showPlanBtn   = isStaff3;

  const { data: profile, isLoading, isError, refetch } = useQuery<ClientProfile>({
    queryKey: ['client-profile', clientId],
    queryFn:  () => staffApi.getClientProfile(clientId),
    staleTime: 2 * 60_000,
    retry: 1,
  });

  const metrics     = profile?.latestMetrics ?? null;
  const heightM     = profile?.heightCm ? profile.heightCm / 100 : null;
  const bmi         = metrics?.weightKg != null && heightM ? metrics.weightKg / (heightM * heightM) : null;
  const bmiInfo     = bmi != null ? bmiLabel(bmi) : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>{clientName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={s.center}>
          <DumbbellSpinner size="large" color="#f05b22" />
        </View>
      ) : isError ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#444" />
          <Text style={s.errTxt}>No se pudo cargar el perfil.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* Avatar placeholder */}
          <View style={s.avatarWrap}>
            <View style={s.avatarCircle}>
              <MaterialCommunityIcons name="account" size={44} color="#f05b22" />
            </View>
            <Text style={s.fullName}>
              {[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || clientName}
            </Text>
          </View>

          {/* Contacto */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Información de Contacto</Text>
            <InfoRow icon="phone-outline"     label="Teléfono" value={profile?.phone ?? null} />
            <InfoRow icon="card-account-details-outline" label="C.I."    value={profile?.ci ?? null} />
            <InfoRow icon="gender-male-female" label="Género"  value={profile?.gender ?? null} />
          </View>

          {/* Métricas corporales */}
          <Text style={s.sectionTitle}>Métricas Corporales</Text>
          {metrics == null && (
            <View style={s.noMetrics}>
              <MaterialCommunityIcons name="chart-bar-stacked" size={32} color="#333" />
              <Text style={s.noMetricsTxt}>Sin registros de métricas aún.</Text>
            </View>
          )}

          {metrics != null && (
            <>
              <View style={s.metricsGrid}>
                <MetricCard
                  label="Peso"
                  value={metrics.weightKg != null ? metrics.weightKg.toFixed(1) : null}
                  unit="kg"
                  icon="scale-bathroom"
                />
                <MetricCard
                  label="Altura"
                  value={profile?.heightCm != null ? profile.heightCm.toFixed(0) : null}
                  unit="cm"
                  icon="human-male-height"
                />
                {bmi != null && bmiInfo != null ? (
                  <View style={[s.metricCard, s.bmiCard]}>
                    <MaterialCommunityIcons name="calculator-variant-outline" size={20} color={bmiInfo.color} style={s.metricIcon} />
                    <Text style={s.metricLabel}>IMC</Text>
                    <Text style={[s.metricValue, { color: bmiInfo.color }]}>{bmi.toFixed(1)}</Text>
                    <Text style={[s.bmiTag, { color: bmiInfo.color }]}>{bmiInfo.label}</Text>
                  </View>
                ) : (
                  <MetricCard label="IMC" value={null} icon="calculator-variant-outline" />
                )}
                <MetricCard
                  label="Cintura"
                  value={metrics.waistCm != null ? metrics.waistCm.toFixed(1) : null}
                  unit="cm"
                  icon="tape-measure"
                />
                <MetricCard
                  label="Pecho"
                  value={metrics.chestCm != null ? metrics.chestCm.toFixed(1) : null}
                  unit="cm"
                  icon="lungs"
                />
                <MetricCard
                  label="% Grasa"
                  value={metrics.bodyFatPercentage != null ? metrics.bodyFatPercentage.toFixed(1) : null}
                  unit="%"
                  icon="fire"
                />
                <MetricCard
                  label="Masa Muscular"
                  value={metrics.muscleMassKg != null ? metrics.muscleMassKg.toFixed(1) : null}
                  unit="kg"
                  icon="arm-flex"
                />
                <MetricCard
                  label="Cadera"
                  value={metrics.hipCm != null ? metrics.hipCm.toFixed(1) : null}
                  unit="cm"
                  icon="human-handsdown"
                />
                <MetricCard
                  label="Brazo"
                  value={metrics.midArmCm != null ? metrics.midArmCm.toFixed(1) : null}
                  unit="cm"
                  icon="arm-flex-outline"
                />
                <MetricCard
                  label="Muslo"
                  value={metrics.thighCm != null ? metrics.thighCm.toFixed(1) : null}
                  unit="cm"
                  icon="human-male"
                />
                <MetricCard
                  label="Pantorrilla"
                  value={metrics.calfCm != null ? metrics.calfCm.toFixed(1) : null}
                  unit="cm"
                  icon="walk"
                />
              </View>
              <Text style={s.metaDate}>
                Último registro: {fmtDate(metrics.recordedAt)}
              </Text>
            </>
          )}

          {/* Condición médica */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Condición Médica</Text>
            {profile?.medicalConditions ? (
              <Text style={s.medicalTxt}>{profile.medicalConditions}</Text>
            ) : (
              <View style={s.noDataRow}>
                <MaterialCommunityIcons name="clipboard-text-off-outline" size={16} color="#333" />
                <Text style={s.noDataTxt}>Sin registro de condiciones médicas</Text>
              </View>
            )}
          </View>

          {/* Acciones — diferenciadas por roleId para separar Entrenador (4) de Nutricionista (5) */}
          <View style={s.actionsRow}>
            {showRutinaBtn && (
              <TouchableOpacity
                style={s.actionBtn}
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    navigation.navigate('AsignarRutina', { studentId: clientId, studentName: clientName });
                  } catch {}
                }}
              >
                <MaterialCommunityIcons name="dumbbell" size={18} color="#fff" />
                <Text style={s.actionTxt}>Asignar Rutina</Text>
              </TouchableOpacity>
            )}

            {showPlanBtn && (
              <TouchableOpacity
                style={[s.actionBtn, s.planBtn]}
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    navigation.navigate('TrainerPlan', { clientId, clientName });
                  } catch {}
                }}
              >
                <MaterialCommunityIcons name="food-apple-outline" size={18} color="#fff" />
                <Text style={s.actionTxt}>Plan Nutricional</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#111' },
  backBtn:   { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle:  { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },

  avatarWrap:   { alignItems: 'center', marginVertical: 20 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1C1C1E', borderWidth: 2, borderColor: '#FF5E00', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  fullName:     { color: '#fff', fontSize: 20, fontWeight: '800' },

  card:      { backgroundColor: '#111111', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2D' },
  cardTitle: { color: '#D1D5DB', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },

  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#111' },
  infoLabel: { color: '#D1D5DB', fontSize: 13, flex: 1 },
  infoValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  sectionTitle: { color: '#D1D5DB', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metricCard:  { width: '30%', flexGrow: 1, backgroundColor: '#111111', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2D' },
  bmiCard:     { borderColor: '#FF5E0033' },
  metricIcon:  { marginBottom: 4 },
  metricLabel: { color: '#D1D5DB', fontSize: 12, marginBottom: 4, textAlign: 'center' },
  metricValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bmiTag:      { fontSize: 12, fontWeight: '600', marginTop: 2 },

  metaDate:    { color: '#9CA3AF', fontSize: 12, textAlign: 'right', marginBottom: 16 },

  noMetrics:    { backgroundColor: '#111111', borderRadius: 14, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2D' },
  noMetricsTxt: { color: '#D1D5DB', fontSize: 13 },

  medicalTxt: { color: '#D1D5DB', fontSize: 13, lineHeight: 20 },
  noDataRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  noDataTxt:  { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' },

  actionsRow: { gap: 10, marginTop: 8 },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f05b22', borderRadius: 12, paddingVertical: 14 },
  planBtn:    { backgroundColor: '#1D4ED8' },
  actionTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },

  errTxt:   { color: '#D1D5DB', fontSize: 14, marginTop: 8 },
  retryBtn: { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginTop: 4 },
  retryTxt: { color: '#f05b22', fontWeight: '700' },
});
