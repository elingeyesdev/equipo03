import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, MyAppointment, AdvisorRequest } from '../../../app/Providers/staff/api/staff.api';

const requestorName = (r: AdvisorRequest) =>
  r.fullName ?? r.clientName
  ?? ([r.user?.profile?.firstName, r.user?.profile?.lastName].filter(Boolean).join(' ') || '—');

const Section = ({
  title, icon, iconColor, empty, children,
}: {
  title: string;
  icon: string;
  iconColor: string;
  empty: boolean;
  children: React.ReactNode;
}) => (
  <View style={s.section}>
    <View style={s.sectionHeader}>
      <MaterialCommunityIcons name={icon as any} size={16} color={iconColor} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
    {empty ? (
      <View style={s.emptyRow}>
        <Text style={s.emptyTxt}>Sin registros disponibles.</Text>
      </View>
    ) : children}
  </View>
);

export const NutritionistDashboard = () => {
  const { user }  = useAuth();
  const firstName = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? 'Nutricionista';
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const {
    data: appointments = [], isLoading: loadingAppts,
    isError: errAppts, refetch: refetchAppts,
  } = useQuery({
    queryKey: ['nutritionist-appointments'],
    queryFn:  staffApi.getMyAppointments,
    staleTime: 60_000,
    retry: 1,
  });

  const {
    data: requests = [], isLoading: loadingReqs,
    refetch: refetchReqs,
  } = useQuery({
    queryKey: ['nutritionist-pending-requests'],
    queryFn:  staffApi.getPendingRequests,
    staleTime: 30_000,
    retry: 0,
  });

  const activePatients = Array.from(
    new Map(
      appointments.map(a => [a.patientName, a])
    ).values()
  );

  const isLoading = loadingAppts || loadingReqs;
  const onRefresh = () => { refetchAppts(); refetchReqs(); };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh}
            tintColor="#06d6a0" colors={['#06d6a0']} />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.saludo}>{saludo},</Text>
            <Text style={s.nombre}>{firstName}</Text>
          </View>
          <View style={s.avatar}>
            <MaterialCommunityIcons name="food-apple-outline" size={26} color="#06d6a0" />
          </View>
        </View>

        {/* ── Resumen ── */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{activePatients.length}</Text>
            <Text style={s.summaryLabel}>Pacientes activos</Text>
          </View>
          <View style={[s.summaryCard, { borderColor: requests.length > 0 ? '#06d6a0' : '#1a1a1a' }]}>
            <Text style={[s.summaryNum, requests.length > 0 && { color: '#06d6a0' }]}>
              {requests.length}
            </Text>
            <Text style={s.summaryLabel}>Solicitudes</Text>
          </View>
        </View>

        {/* ── Solicitudes Pendientes ── */}
        <Section
          title="Solicitudes Pendientes"
          icon="bell-ring-outline"
          iconColor="#06d6a0"
          empty={requests.length === 0}
        >
          {requests.map(req => (
            <View key={req.id} style={s.requestCard}>
              <View style={s.requestIcon}>
                <MaterialCommunityIcons name="account-clock-outline" size={20} color="#06d6a0" />
              </View>
              <View style={s.requestInfo}>
                <Text style={s.requestName}>{requestorName(req)}</Text>
                <Text style={s.requestSub}>Solicitud de asesoría · Pendiente</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* ── Mis Pacientes Activos ── */}
        {errAppts ? (
          <View style={s.errorRow}>
            <MaterialCommunityIcons name="wifi-off" size={20} color="#444" />
            <Text style={s.soft}>No se pudo cargar pacientes.</Text>
            <TouchableOpacity onPress={() => refetchAppts()}>
              <Text style={s.retryTxt}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Section
            title="Mis Pacientes Activos"
            icon="account-heart-outline"
            iconColor="#38BDF8"
            empty={activePatients.length === 0}
          >
            {activePatients.map((item: MyAppointment, idx) => (
              <View key={`${item.id}-${idx}`} style={s.patientCard}>
                <View style={s.iconBadge}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#06d6a0" />
                </View>
                <Text style={s.patientName} numberOfLines={1}>{item.patientName}</Text>
              </View>
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingBottom: 100 },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerLeft: { flex: 1 },
  saludo:     { color: '#555', fontSize: 14 },
  nombre:     { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00E5A3' },

  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryNum:   { color: '#fff', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#444', fontSize: 11, marginTop: 2 },

  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  sectionTitle:  { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },

  emptyRow: { backgroundColor: '#0e0e0e', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  emptyTxt: { color: '#333', fontSize: 13, textAlign: 'center' },

  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#00E5A344', gap: 12 },
  requestIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00E5A3' },
  requestInfo: { flex: 1 },
  requestName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  requestSub:  { color: '#555', fontSize: 11, marginTop: 2 },

  patientCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a', gap: 12 },
  iconBadge:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#00E5A3' },
  patientName:  { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#0e0e0e', borderRadius: 12, marginBottom: 24 },
  soft:     { color: '#444', fontSize: 13, flex: 1 },
  retryTxt: { color: '#06d6a0', fontWeight: '600', fontSize: 13 },
});
