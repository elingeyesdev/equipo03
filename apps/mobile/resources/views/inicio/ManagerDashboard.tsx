import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { gymApi, DashboardStats } from '../../../app/Providers/gyms/api/gym.api';

const { width } = Dimensions.get('window');

const aforoColor = (pct: number) =>
  pct > 0.85 ? '#EF4444' : pct > 0.6 ? '#F97316' : '#22C55E';

const FALLBACK: DashboardStats = {
  occupancy:  0,
  capacity:   100,
  totalToday: 0,
  completed:  0,
  pending:    0,
};

export const ManagerDashboard = () => {
  const navigation = useNavigation<any>();
  const { user }   = useAuth();

  const firstName = (user as any)?.profile?.firstName
    ?? (user as any)?.firstName
    ?? 'Gerente';

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const { data, isLoading, isRefetching, refetch, isError } = useQuery({
    queryKey: ['manager-dashboard-stats'],
    queryFn:  gymApi.getDashboardStats,
    refetchInterval: 60_000,   // refresca cada minuto
    staleTime:       30_000,
    retry: 1,
  });

  const stats  = data ?? FALLBACK;
  const pct    = stats.capacity > 0 ? stats.occupancy / stats.capacity : 0;
  const color  = aforoColor(pct);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#f05b22"
            colors={['#f05b22']}
          />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.saludo}>{saludo},</Text>
            <Text style={s.nombre}>{firstName}</Text>
            <Text style={s.sub}>Resumen de tu Sucursal</Text>
          </View>
          <View style={s.avatarBox}>
            <MaterialCommunityIcons name="shield-account" size={32} color="#f05b22" />
          </View>
        </View>

        {/* ── Widget Aforo ── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialCommunityIcons name="account-group-outline" size={20} color="#f05b22" />
            <Text style={s.cardTitle}>Ocupación Actual</Text>
            <View style={[s.dot, { backgroundColor: color }]} />
            <Text style={[s.dotLabel, { color }]}>En vivo</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#f05b22" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={s.aforoNum}>
                <Text style={s.aforoBig}>{stats.occupancy}</Text>
                <Text style={s.aforoMax}> / {stats.capacity}</Text>
              </Text>
              <Text style={s.aforoPct}>{Math.round(pct * 100)}% de capacidad</Text>

              {/* Barra de progreso */}
              <View style={s.barBg}>
                <View style={[
                  s.barFill,
                  { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color },
                ]} />
              </View>

              <View style={s.aforoRow}>
                <View style={s.aforoStat}>
                  <MaterialCommunityIcons name="check-circle-outline" size={14} color="#22C55E" />
                  <Text style={s.aforoStatTxt}>{stats.occupancy} presentes</Text>
                </View>
                <View style={s.aforoStat}>
                  <MaterialCommunityIcons name="seat-outline" size={14} color="#555" />
                  <Text style={s.aforoStatTxt}>{Math.max(stats.capacity - stats.occupancy, 0)} libres</Text>
                </View>
              </View>
            </>
          )}

          {isError && (
            <Text style={s.errorTxt}>No se pudo cargar el aforo. Desliza para reintentar.</Text>
          )}
        </View>

        {/* ── Acciones rápidas ── */}
        <Text style={s.sectionTitle}>Acciones Rápidas</Text>

        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => navigation.navigate('Auditoría')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#0A0A0A" />
          <Text style={s.primaryBtnTxt}>Auditoría de Accesos</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#0A0A0A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => navigation.navigate('Escaner')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={22} color="#f05b22" />
          <Text style={s.secondaryBtnTxt}>Escanear QR de Ingreso</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#f05b22" />
        </TouchableOpacity>

        {/* ── Stat cards ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="calendar-today" size={22} color="#f05b22" />
            {isLoading
              ? <ActivityIndicator size="small" color="#f05b22" />
              : <Text style={s.statNum}>{stats.totalToday}</Text>
            }
            <Text style={s.statLabel}>Reservas hoy</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="account-check-outline" size={22} color="#22C55E" />
            {isLoading
              ? <ActivityIndicator size="small" color="#22C55E" />
              : <Text style={s.statNum}>{stats.completed}</Text>
            }
            <Text style={s.statLabel}>Ingresos</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="clock-alert-outline" size={22} color="#F97316" />
            {isLoading
              ? <ActivityIndicator size="small" color="#F97316" />
              : <Text style={s.statNum}>{stats.pending}</Text>
            }
            <Text style={s.statLabel}>Pendientes</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, paddingBottom: 100 },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerLeft: { flex: 1 },
  saludo:     { color: '#555', fontSize: 14, fontWeight: '500' },
  nombre:     { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 },
  sub:        { color: '#444', fontSize: 13, marginTop: 4 },
  avatarBox:  { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1c1c1e', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(240,91,34,0.3)' },

  card:       { backgroundColor: '#0e0e0e', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#1a1a1a' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  cardTitle:  { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
  dot:        { width: 7, height: 7, borderRadius: 4 },
  dotLabel:   { fontSize: 11, fontWeight: '600' },

  aforoNum:     { marginBottom: 4 },
  aforoBig:     { color: '#fff', fontSize: 40, fontWeight: '900' },
  aforoMax:     { color: '#444', fontSize: 20, fontWeight: '600' },
  aforoPct:     { color: '#555', fontSize: 12, marginBottom: 14 },

  barBg:    { height: 8, backgroundColor: '#1a1a1a', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  barFill:  { height: '100%', borderRadius: 4 },

  aforoRow:     { flexDirection: 'row', gap: 16 },
  aforoStat:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aforoStatTxt: { color: '#555', fontSize: 12 },

  errorTxt: { color: '#EF4444', fontSize: 12, textAlign: 'center', marginTop: 8 },

  sectionTitle: { color: '#555', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },

  primaryBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f05b22', borderRadius: 14, padding: 18, marginBottom: 10 },
  primaryBtnTxt: { flex: 1, color: '#0A0A0A', fontSize: 16, fontWeight: '800' },

  secondaryBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0e0e0e', borderRadius: 14, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(240,91,34,0.3)' },
  secondaryBtnTxt: { flex: 1, color: '#f05b22', fontSize: 15, fontWeight: '700' },

  statsRow:  { flexDirection: 'row', gap: 10 },
  statCard:  { flex: 1, backgroundColor: '#0e0e0e', borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#1a1a1a' },
  statNum:   { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#444', fontSize: 10, textAlign: 'center' },
});
