import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import {
  staffApi,
  PendingTrainerRequest,
} from '../../../app/Providers/staff/api/staff.api';

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

// ─── Section ─────────────────────────────────────────────────────────────────
const Section = ({
  title, icon, iconColor, empty, children,
}: {
  title: string; icon: string; iconColor: string; empty: boolean; children: React.ReactNode;
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

export const TrainerDashboard = () => {
  const { user }   = useAuth();
  const navigation = useNavigation<any>();
  const firstName   = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? 'Entrenador';
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const [processingId, setProcessingId] = useState<number | null>(null);

  const {
    data: requestsRaw, isLoading: loadingReqs, refetch: refetchReqs,
  } = useQuery({
    queryKey: ['trainer-pending-requests'],
    queryFn:  staffApi.getPendingTrainerRequests,
    staleTime: 30_000,
    retry: 1,
  });

  const {
    data: adviseesRaw, isLoading: loadingAdvisees, refetch: refetchAdvisees,
  } = useQuery({
    queryKey: ['trainer-active-advisees'],
    queryFn:  staffApi.getActiveAdvisees,
    staleTime: 60_000,
    retry: 1,
  });

  // Defensive unwrap: both queries return PaginatedResponse<T>, not T[]
  const requests: PendingTrainerRequest[] = Array.isArray(requestsRaw)
    ? requestsRaw
    : ((requestsRaw as any)?.data ?? []);
  const advisees: any[] = Array.isArray(adviseesRaw)
    ? adviseesRaw
    : ((adviseesRaw as any)?.data ?? []);

  const isRefreshing = loadingReqs || loadingAdvisees;
  const onRefresh    = () => { refetchReqs(); refetchAdvisees(); };

  const alumnosLabel = loadingAdvisees
    ? 'Cargando...'
    : `${advisees.length} alumno${advisees.length !== 1 ? 's' : ''} asignado${advisees.length !== 1 ? 's' : ''}`;

  const handleAccept = async (req: PendingTrainerRequest) => {
    setProcessingId(req.id);
    try {
      await staffApi.acceptAdvisorRequest(req.id);
      await Promise.all([refetchReqs(), refetchAdvisees()]);
      navigation.navigate('PerfilAlumno', {
        clientId:   req.clientId,
        clientName: req.clientName,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo aceptar la solicitud.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (req: PendingTrainerRequest) => {
    Alert.alert(
      '¿Rechazar solicitud?',
      `¿Estás seguro de que deseas rechazar la solicitud de ${req.clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(req.id);
            try {
              await staffApi.rejectAdvisorRequest(req.id);
              await refetchReqs();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo rechazar la solicitud.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#f05b22"
            colors={['#f05b22']}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.saludo}>{saludo},</Text>
            <Text style={s.nombre}>{firstName}</Text>
          </View>
          <View style={s.avatar}>
            <MaterialCommunityIcons name="dumbbell" size={26} color="#f05b22" />
          </View>
        </View>

        {/* Resumen */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{advisees.length}</Text>
            <Text style={s.summaryLabel}>Alumnos activos</Text>
          </View>
          <View style={[s.summaryCard, { borderColor: requests.length > 0 ? '#f05b22' : '#1a1a1a' }]}>
            <Text style={[s.summaryNum, requests.length > 0 && { color: '#f05b22' }]}>
              {requests.length}
            </Text>
            <Text style={s.summaryLabel}>Solicitudes</Text>
          </View>
        </View>

        {/* Solicitudes Pendientes */}
        <Section
          title="Solicitudes Pendientes"
          icon="bell-ring-outline"
          iconColor="#f05b22"
          empty={requests.length === 0}
        >
          {requests.map((req) => {
            const isProcessing = processingId === req.id;
            const fecha = fmtDate(req.createdAt);
            return (
              <View key={req.id} style={s.requestCard}>
                <View style={s.requestIcon}>
                  <MaterialCommunityIcons name="account-clock-outline" size={20} color="#f05b22" />
                </View>
                <View style={s.requestInfo}>
                  <Text style={s.requestName}>{req.clientName}</Text>
                  <Text style={s.requestSub}>{fecha}</Text>
                </View>
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#f05b22" style={{ marginLeft: 8 }} />
                ) : (
                  <View style={s.requestActions}>
                    <TouchableOpacity
                      style={s.acceptBtn}
                      activeOpacity={0.8}
                      onPress={() => handleAccept(req)}
                    >
                      <MaterialCommunityIcons name="check" size={14} color="#fff" />
                      <Text style={s.acceptTxt}>Aceptar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.rejectBtn}
                      activeOpacity={0.8}
                      onPress={() => handleReject(req)}
                    >
                      <MaterialCommunityIcons name="close" size={14} color="#fff" />
                      <Text style={s.rejectTxt}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </Section>

        {/* Mis Alumnos Activos → sub-pantalla */}
        <TouchableOpacity
          style={s.alumnosCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MisAlumnos')}
        >
          <View style={s.alumnosLeft}>
            <View style={s.alumnosIconBox}>
              <MaterialCommunityIcons name="account-group-outline" size={24} color="#38BDF8" />
            </View>
            <View>
              <Text style={s.alumnosTitle}>Mis Alumnos Activos</Text>
              <Text style={s.alumnosSub}>{alumnosLabel}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#38BDF8" />
        </TouchableOpacity>
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
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF5E00' },

  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryNum:   { color: '#fff', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#444', fontSize: 13, marginTop: 2 },

  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  sectionTitle:  { color: '#888', fontSize: 13, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },

  emptyRow: { backgroundColor: '#0e0e0e', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  emptyTxt: { color: '#333', fontSize: 14, textAlign: 'center' },

  requestCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#FF5E0044', gap: 10 },
  requestIcon:    { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF5E00' },
  requestInfo:    { flex: 1 },
  requestName:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  requestSub:     { color: '#555', fontSize: 13, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16a34a', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  acceptTxt:      { color: '#fff', fontSize: 12, fontWeight: '700' },
  rejectBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dc2626', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  rejectTxt:      { color: '#fff', fontSize: 12, fontWeight: '700' },

  alumnosCard:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0e0e0e', borderRadius: 16,
    padding: 18, marginBottom: 24,
    borderWidth: 1, borderColor: '#38BDF822', gap: 14,
  },
  alumnosLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  alumnosIconBox: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: '#0d2a3d', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#38BDF844',
  },
  alumnosTitle:   { color: '#fff', fontSize: 16, fontWeight: '800' },
  alumnosSub:     { color: '#38BDF8', fontSize: 13, marginTop: 3 },
});
