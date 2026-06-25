import React, { useState } from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';
import {
  staffApi,
  PendingTrainerRequest,
  ActiveAdvisee,
} from '../../../app/Providers/staff/api/staff.api';

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

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

export const NutritionistDashboard = () => {
  const { user }    = useAuth();
  const navigation  = useNavigation<any>();
  const queryClient = useQueryClient();
  const firstName   = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? 'Nutricionista';
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const [processingId, setProcessingId] = useState<number | null>(null);

  const {
    data: requestsRaw, isLoading: loadingReqs, refetch: refetchReqs,
  } = useQuery({
    queryKey: ['nutritionist-pending-requests'],
    queryFn:  staffApi.getPendingTrainerRequests,
    staleTime: 30_000,
    retry: 1,
  });
  const requests: PendingTrainerRequest[] = Array.isArray(requestsRaw)
    ? requestsRaw
    : ((requestsRaw as any)?.data ?? []);

  const {
    data: adviseesRaw, isLoading: loadingAdvisees, refetch: refetchAdvisees,
  } = useQuery({
    queryKey: ['nutritionist-active-advisees'],
    queryFn:  staffApi.getActiveAdvisees,
    staleTime: 60_000,
    retry: 1,
  });
  const advisees: ActiveAdvisee[] = Array.isArray(adviseesRaw)
    ? adviseesRaw
    : ((adviseesRaw as any)?.data ?? []);

  const isRefreshing = loadingReqs || loadingAdvisees;
  const onRefresh    = () => { refetchReqs(); refetchAdvisees(); };

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

  const handleCancelAdvisee = (item: ActiveAdvisee) => {
    Alert.alert(
      'Cancelar asesoría',
      `¿Deseas cancelar la asesoría con ${item.clientName}? Se reiniciará su plan nutricional.`,
      [
        { text: 'No cancelar', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(item.id);
            try {
              await staffApi.cancelAdvisorship(item.id);
              await refetchAdvisees();
              queryClient.invalidateQueries({ queryKey: ['nutritionist-active-advisees'] });
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo cancelar la asesoría.');
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
            tintColor="#06d6a0"
            colors={['#06d6a0']}
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
            <MaterialCommunityIcons name="food-apple-outline" size={26} color="#06d6a0" />
          </View>
        </View>

        {/* Resumen */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryNum}>{advisees.length}</Text>
            <Text style={s.summaryLabel}>Pacientes activos</Text>
          </View>
          <View style={[s.summaryCard, { borderColor: requests.length > 0 ? '#06d6a0' : '#1a1a1a' }]}>
            <Text style={[s.summaryNum, requests.length > 0 && { color: '#06d6a0' }]}>
              {requests.length}
            </Text>
            <Text style={s.summaryLabel}>Solicitudes</Text>
          </View>
        </View>

        {/* Solicitudes Pendientes */}
        <Section
          title="Solicitudes Pendientes"
          icon="bell-ring-outline"
          iconColor="#06d6a0"
          empty={requests.length === 0}
        >
          {requests.map((req) => {
            const isProcessing = processingId === req.id;
            return (
              <View key={req.id} style={s.requestCard}>
                <View style={s.requestIcon}>
                  <MaterialCommunityIcons name="account-clock-outline" size={20} color="#06d6a0" />
                </View>
                <View style={s.requestInfo}>
                  <Text style={s.requestName}>{req.clientName}</Text>
                  <Text style={s.requestSub}>{fmtDate(req.createdAt)}</Text>
                </View>
                {isProcessing ? (
                  <DumbbellSpinner size="small" color="#06d6a0" style={{ marginLeft: 8 }} />
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

        {/* Mis Pacientes Activos */}
        <Section
          title="Mis Pacientes Activos"
          icon="account-heart-outline"
          iconColor="#38BDF8"
          empty={advisees.length === 0}
        >
          {advisees.map((item) => {
            const isCancelling = processingId === item.id;
            return (
              <View key={item.clientId} style={s.patientCard}>
                <View style={s.iconBadge}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#06d6a0" />
                </View>
                <View style={s.patientInfo}>
                  <Text style={s.patientName}>{item.clientName}</Text>
                  <Text style={s.patientSub} numberOfLines={1}>
                    {item.phone ?? 'Sin teléfono registrado'}
                  </Text>
                </View>
                {isCancelling ? (
                  <DumbbellSpinner size="small" color="#EF4444" style={{ marginLeft: 8 }} />
                ) : (
                  <View style={s.patientActions}>
                    <TouchableOpacity
                      style={s.profileBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        try {
                          navigation.navigate('PerfilAlumno', {
                            clientId:   item.clientId,
                            clientName: item.clientName,
                          });
                        } catch {}
                      }}
                    >
                      <Text style={s.profileBtnTxt}>Ver Perfil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.cancelBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCancelAdvisee(item)}
                    >
                      <MaterialCommunityIcons name="cancel" size={12} color="#EF4444" />
                      <Text style={s.cancelBtnTxt}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </Section>
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
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#06d6a0' },

  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  summaryNum:   { color: '#fff', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#444', fontSize: 11, marginTop: 2 },

  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  sectionTitle:  { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },

  emptyRow: { backgroundColor: '#0e0e0e', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  emptyTxt: { color: '#333', fontSize: 13, textAlign: 'center' },

  requestCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#06d6a044', gap: 10 },
  requestIcon:    { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#06d6a0' },
  requestInfo:    { flex: 1 },
  requestName:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  requestSub:     { color: '#555', fontSize: 11, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16a34a', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  acceptTxt:      { color: '#fff', fontSize: 11, fontWeight: '700' },
  rejectBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dc2626', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  rejectTxt:      { color: '#fff', fontSize: 11, fontWeight: '700' },

  patientCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a', gap: 12 },
  iconBadge:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#06d6a0' },
  patientInfo:    { flex: 1 },
  patientName:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  patientSub:     { color: '#555', fontSize: 11, marginTop: 2 },
  patientActions: { flexDirection: 'column', gap: 6, alignItems: 'flex-end' },
  profileBtn:     { backgroundColor: '#1C1C1E', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#3A3A3C' },
  profileBtnTxt:  { color: '#06d6a0', fontSize: 12, fontWeight: '700' },
  cancelBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1C1C1E', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#EF444466' },
  cancelBtnTxt:   { color: '#EF4444', fontSize: 11, fontWeight: '700' },
});
