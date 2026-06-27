import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { DumbbellSpinner } from '../../../app/Shared/components/ui/DumbbellSpinner';
import {
  staffApi,
  PendingTrainerRequest,
  TrainingSession,
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

const CHUNK = 8;
const INACTIVE_THRESHOLD = 5;

export const TrainerDashboard = () => {
  const { user }   = useAuth();
  const navigation = useNavigation<any>();
  const firstName  = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? '';
  const lastName   = (user as any)?.profile?.lastName  ?? (user as any)?.lastName  ?? '';
  const fullName   = `${firstName}${lastName ? ' ' + lastName : ''}`.trim() || 'Entrenador';
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const hoy    = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

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

  // ─── Session cache (chunked lazy loading) ───────────────────────────────────
  const [sessionMap, setSessionMap] = useState<Map<number, TrainingSession[]>>(new Map());
  const [carouselPage, setCarouselPage] = useState(0);
  const loadedRef = useRef<Set<number>>(new Set());

  const fetchChunk = useCallback(async (ids: number[]) => {
    const toFetch = ids.filter(id => !loadedRef.current.has(id));
    if (!toFetch.length) return;
    toFetch.forEach(id => loadedRef.current.add(id));
    const results = await Promise.all(
      toFetch.map(id =>
        staffApi.getSessionsForUser(id, { limit: 10, offset: 0 })
          .catch(() => ({ data: [] as TrainingSession[] }))
      )
    );
    setSessionMap(prev => {
      const next = new Map(prev);
      toFetch.forEach((id, i) => {
        const raw = results[i];
        next.set(id, Array.isArray(raw) ? raw : ((raw as any)?.data ?? []));
      });
      return next;
    });
  }, []);

  const adviseeChunks = useMemo<any[][]>(() => {
    const out: any[][] = [];
    for (let i = 0; i < advisees.length; i += CHUNK) out.push(advisees.slice(i, i + CHUNK));
    return out;
  }, [advisees]);

  const inactiveClients = useMemo(() => {
    const NOW = Date.now();
    const results: { clientId: number; clientName: string; days: number }[] = [];
    for (const a of advisees) {
      if (!sessionMap.has(a.clientId)) continue;
      const sessions = sessionMap.get(a.clientId) ?? [];
      const last = [...sessions]
        .filter(s => s.status === 'COMPLETED')
        .sort((x, y) => new Date(y.startedAt).getTime() - new Date(x.startedAt).getTime())[0];
      const days = last
        ? Math.floor((NOW - new Date(last.startedAt).getTime()) / 86_400_000)
        : 999;
      if (days >= INACTIVE_THRESHOLD) {
        results.push({ clientId: a.clientId, clientName: a.clientName, days });
      }
    }
    return results.sort((a, b) => b.days - a.days).slice(0, 10);
  }, [advisees, sessionMap]);

  const sessionLoadedCount = useMemo(
    () => advisees.filter((a: any) => sessionMap.has(a.clientId)).length,
    [advisees, sessionMap],
  );

  // Load all advisees' sessions sequentially so inactivity ranking is complete
  useEffect(() => {
    if (!advisees.length) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < advisees.length; i += CHUNK) {
        if (cancelled) break;
        await fetchChunk(advisees.slice(i, i + CHUNK).map((a: any) => a.clientId));
      }
    })();
    return () => { cancelled = true; };
  }, [advisees.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep carousel page in sync with session cache
  useEffect(() => {
    const chunk = adviseeChunks[carouselPage];
    if (chunk) fetchChunk(chunk.map((a: any) => a.clientId));
  }, [carouselPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const isRefreshing = loadingReqs || loadingAdvisees;
  const onRefresh    = () => {
    setSessionMap(new Map());
    loadedRef.current.clear();
    setCarouselPage(0);
    refetchReqs();
    refetchAdvisees();
  };

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
            <Text style={s.nombre}>{fullName}</Text>
          </View>
          <View style={s.avatar}>
            <MaterialCommunityIcons name="dumbbell" size={26} color="#f05b22" />
          </View>
        </View>

        <View style={s.dateRow}>
          <MaterialCommunityIcons name="calendar-today" size={13} color="#555" />
          <Text style={s.dateTxt}>{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</Text>
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
                  <DumbbellSpinner size="small" color="#f05b22" style={{ marginLeft: 8 }} />
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

        <TouchableOpacity
          style={s.actionRow}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TrainerReport')}
        >
          <View style={s.actionIconBox}>
            <MaterialCommunityIcons name="file-chart-outline" size={20} color="#FF5E00" />
          </View>
          <Text style={s.actionRowTxt}>Ver Informe</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
        </TouchableOpacity>

        {/* ─── Sin Actividad Reciente (C) ─────────────────────────────────── */}
        {!loadingAdvisees && advisees.length > 0 && (
          <Section
            title="Sin Actividad Reciente"
            icon="sleep"
            iconColor="#facc15"
            empty={false}
          >
            <>
              {sessionLoadedCount < advisees.length && (
                <View style={[s.emptyRow, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}>
                  <DumbbellSpinner size="small" color="#facc15" />
                  <Text style={s.emptyTxt}>
                    Analizando {sessionLoadedCount}/{advisees.length} alumnos...
                  </Text>
                </View>
              )}
              {inactiveClients.map(item => {
                const dotColor = item.days >= 14 ? '#ef4444' : item.days >= 7 ? '#f05b22' : '#facc15';
                return (
                  <TouchableOpacity
                    key={item.clientId}
                    style={s.inactiveRow}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PerfilAlumno', {
                      clientId: item.clientId,
                      clientName: item.clientName,
                    })}
                  >
                    <View style={[s.inactiveDot, { backgroundColor: dotColor }]} />
                    <Text style={s.inactiveName} numberOfLines={1}>{item.clientName}</Text>
                    <Text style={[s.inactiveDays, { color: dotColor }]}>
                      {item.days >= 999 ? 'Sin sesiones' : `${item.days}d sin actividad`}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={14} color="#555" />
                  </TouchableOpacity>
                );
              })}
              {inactiveClients.length === 0 && sessionLoadedCount === advisees.length && (
                <View style={[s.emptyRow, { flexDirection: 'row', justifyContent: 'center', gap: 8 }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color="#22c55e" />
                  <Text style={[s.emptyTxt, { color: '#22c55e' }]}>
                    Todos activos en los últimos {INACTIVE_THRESHOLD} días.
                  </Text>
                </View>
              )}
            </>
          </Section>
        )}

        {/* ─── Actividad Reciente — carrusel de 8 en 8 (A) ───────────────── */}
        {!loadingAdvisees && advisees.length > 0 && (
          <Section
            title="Actividad Reciente"
            icon="history"
            iconColor="#38BDF8"
            empty={false}
          >
            <>
              {(adviseeChunks[carouselPage] ?? []).map((a: any) => {
                const sessions = sessionMap.get(a.clientId);
                const loaded   = sessionMap.has(a.clientId);
                const completed = (sessions ?? []).filter((s: TrainingSession) => s.status === 'COMPLETED');
                const last = [...completed].sort(
                  (x, y) => new Date(y.startedAt).getTime() - new Date(x.startedAt).getTime()
                )[0];
                return (
                  <TouchableOpacity
                    key={a.clientId}
                    style={s.activityRow}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('HistorialRutina', {
                      clientId:   a.clientId,
                      clientName: a.clientName,
                      phone:      a.phone,
                    })}
                  >
                    <View style={s.activityAvatar}>
                      <Text style={s.activityAvatarTxt}>
                        {(a.clientName ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.activityName} numberOfLines={1}>{a.clientName}</Text>
                      <Text style={s.activitySub}>
                        {!loaded
                          ? 'Cargando...'
                          : last
                          ? `Última sesión: ${fmtDate(last.startedAt)}`
                          : 'Sin sesiones registradas'}
                      </Text>
                    </View>
                    {loaded && completed.length > 0 && (
                      <View style={s.sessionBadge}>
                        <Text style={s.sessionBadgeNum}>{completed.length}</Text>
                        <Text style={s.sessionBadgeLbl}>ses.</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons name="chevron-right" size={14} color="#555" />
                  </TouchableOpacity>
                );
              })}

              {adviseeChunks.length > 1 && (
                <View style={s.pageNav}>
                  <TouchableOpacity
                    style={[s.pageBtn, carouselPage === 0 && s.pageBtnDisabled]}
                    onPress={() => setCarouselPage(p => Math.max(0, p - 1))}
                    disabled={carouselPage === 0}
                  >
                    <MaterialCommunityIcons
                      name="chevron-left" size={16}
                      color={carouselPage === 0 ? '#333' : '#38BDF8'}
                    />
                    <Text style={[s.pageBtnTxt, carouselPage === 0 && s.pageBtnDisabledTxt]}>
                      Anterior
                    </Text>
                  </TouchableOpacity>

                  <View style={s.pageDots}>
                    {adviseeChunks.map((_, i) => (
                      <TouchableOpacity key={i} onPress={() => setCarouselPage(i)} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
                        <View style={[s.pageDot, i === carouselPage && s.pageDotActive]} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[s.pageBtn, carouselPage === adviseeChunks.length - 1 && s.pageBtnDisabled]}
                    onPress={() => setCarouselPage(p => Math.min(adviseeChunks.length - 1, p + 1))}
                    disabled={carouselPage === adviseeChunks.length - 1}
                  >
                    <Text style={[s.pageBtnTxt, carouselPage === adviseeChunks.length - 1 && s.pageBtnDisabledTxt]}>
                      Siguiente
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right" size={16}
                      color={carouselPage === adviseeChunks.length - 1 ? '#333' : '#38BDF8'}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </>
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { padding: 20, paddingBottom: 100 },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  dateTxt: { color: '#D1D5DB', fontSize: 14 },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  headerLeft: { flex: 1 },
  saludo:     { color: '#888', fontSize: 15 },
  nombre:     { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF5E00' },

  summaryRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard:  { flex: 1, backgroundColor: '#111111', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1C1C1E' },

  actionRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111111', borderRadius: 14, borderWidth: 1, borderColor: '#1C1C1E', paddingVertical: 16, paddingHorizontal: 18, marginBottom: 8, gap: 14 },
  actionIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#2A0F00', justifyContent: 'center', alignItems: 'center' },
  actionRowTxt:  { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' as const },
  summaryNum:   { color: '#fff', fontSize: 26, fontWeight: '900' },
  summaryLabel: { color: '#D1D5DB', fontSize: 13, marginTop: 2 },

  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  sectionTitle:  { color: '#D1D5DB', fontSize: 13, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },

  emptyRow: { backgroundColor: '#111111', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1C1C1E' },
  emptyTxt: { color: '#D1D5DB', fontSize: 14, textAlign: 'center' },

  requestCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111111', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#FF5E0044', gap: 10 },
  requestIcon:    { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FF5E00' },
  requestInfo:    { flex: 1 },
  requestName:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  requestSub:     { color: '#D1D5DB', fontSize: 14, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16a34a', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  acceptTxt:      { color: '#fff', fontSize: 12, fontWeight: '700' },
  rejectBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dc2626', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  rejectTxt:      { color: '#fff', fontSize: 12, fontWeight: '700' },

  alumnosCard:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111111', borderRadius: 16,
    padding: 18, marginBottom: 12,
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

  // ─── Inactivity section (C) ─────────────────────────────────────────────────
  inactiveRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111111', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2D', gap: 10 },
  inactiveDot:  { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  inactiveName: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  inactiveDays: { fontSize: 12, fontWeight: '700' },

  // ─── Activity carousel (A) ──────────────────────────────────────────────────
  activityRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111111', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2D', gap: 10 },
  activityAvatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0d2a3d', borderWidth: 1, borderColor: '#38BDF844', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  activityAvatarTxt: { color: '#38BDF8', fontSize: 14, fontWeight: '800' },
  activityName:      { color: '#fff', fontSize: 14, fontWeight: '600' },
  activitySub:       { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  sessionBadge:      { alignItems: 'center', minWidth: 40 },
  sessionBadgeNum:   { color: '#38BDF8', fontSize: 15, fontWeight: '800' },
  sessionBadgeLbl:   { color: '#9CA3AF', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  pageNav:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1C1C1E' },
  pageBtn:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 8 },
  pageBtnDisabled:   { opacity: 0.35 },
  pageBtnTxt:        { color: '#38BDF8', fontSize: 13, fontWeight: '600' },
  pageBtnDisabledTxt:{ color: '#333' },
  pageDots:          { flexDirection: 'row', gap: 6, alignItems: 'center' },
  pageDot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2A2A2D' },
  pageDotActive:     { width: 18, height: 6, borderRadius: 3, backgroundColor: '#38BDF8' },
});
