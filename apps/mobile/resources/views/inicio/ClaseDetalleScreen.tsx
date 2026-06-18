import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import authAxios from '../../../app/Providers/auth/authAxios';

// ── Tipos ────────────────────────────────────────────────────────────────────

type StudentReservation = {
  id?:              number | string;
  reservationId?:   number | string;
  status?:          string;
  reservationDate?: string;
  createdAt?:       string;
  date?:            string;
  reservedAt?:      string;
  startTime?:       string;
  endTime?:         string;
  activityName?:    string;
  className?:       string;
  fullName?:        string;
  clientName?:      string;
  user?: {
    email?: string;
    profile?: {
      fullName?:  string;
      firstName?: string;
      lastName?:  string;
    };
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const clientName = (r: StudentReservation): string => {
  if (r.fullName)   return r.fullName;
  if (r.clientName) return r.clientName;
  const profile = r.user?.profile;
  if (profile?.fullName) return profile.fullName;
  const parts = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  if (parts) return parts;
  return r.user?.email ?? `Alumno #${r.id}`;
};

const fmt5 = (t?: string) => (t ?? '').substring(0, 5) || '—';

const fmtDate = (iso?: string): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}  ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
};

const FILTERS = ['Todos', 'Hoy', 'Semana', 'Mes', 'Confirmadas'] as const;
type FilterType = typeof FILTERS[number];

// ── Componente ────────────────────────────────────────────────────────────────

export const ClaseDetalleScreen = () => {
  const route      = useRoute<any>();
  const navigation = useNavigation();
  const { activityName, startTime, endTime } = (route.params ?? {}) as {
    scheduleId?:   number;
    activityName?: string;
    startTime?:    string;
    endTime?:      string;
  };

  const [allReservas,      setAllReservas]      = useState<StudentReservation[]>([]);
  const [filteredReservas, setFilteredReservas] = useState<StudentReservation[]>([]);
  const [activeFilter,     setActiveFilter]     = useState<FilterType>('Todos');
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(false);

  // ── Lógica de filtrado ────────────────────────────────────────────────────

  const applyFilter = useCallback((filterType: FilterType, list: StudentReservation[]) => {
    setActiveFilter(filterType);
    const today = new Date();

    const filtered = list.filter(res => {
      const raw     = res.reservationDate ?? res.createdAt ?? res.date ?? res.reservedAt;
      const resDate = raw ? new Date(raw) : null;

      if (filterType === 'Confirmadas') {
        return res.status?.toUpperCase() === 'CONFIRMADA';
      }
      if (!resDate) return filterType === 'Todos';

      if (filterType === 'Hoy') {
        return resDate.toDateString() === today.toDateString();
      }
      if (filterType === 'Semana') {
        const diffTime = Math.abs(today.getTime() - resDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (filterType === 'Mes') {
        return (
          resDate.getMonth()    === today.getMonth() &&
          resDate.getFullYear() === today.getFullYear()
        );
      }
      return true; // 'Todos'
    });

    setFilteredReservas(filtered);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setError(false);
    authAxios
      .get('/api/staff/me/students')
      .then(res => {
        const raw = res.data?.data ?? res.data ?? [];
        const list: StudentReservation[] = Array.isArray(raw) ? raw : [];
        setAllReservas(list);
        setFilteredReservas(list); // sin filtro inicial
      })
      .catch(err => {
        // fetch failed
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const timeRange = endTime
    ? `${fmt5(startTime)} - ${fmt5(endTime)}`
    : fmt5(startTime);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Header con botón atrás ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {activityName ?? 'Registro de Alumnos'}
          </Text>
          <View style={s.headerMeta}>
            {timeRange !== '—' ? (
              <>
                <Feather name="clock" size={12} color="#38BDF8" />
                <Text style={s.headerTime}>{timeRange}</Text>
                <Text style={s.headerDot}>·</Text>
              </>
            ) : null}
            <Feather name="users" size={12} color="#555" />
            <Text style={s.headerCount}>
              {loading ? '…' : filteredReservas.length} alumno(s)
            </Text>
          </View>
        </View>
      </View>

      {/* ── Filtros tipo píldora ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersRow}
        style={s.filtersScroll}
      >
        {FILTERS.map(f => {
          const active = f === activeFilter;
          return (
            <TouchableOpacity
              key={f}
              style={[s.pill, active && s.pillActive]}
              onPress={() => applyFilter(f, allReservas)}
              activeOpacity={0.75}
            >
              <Text style={[s.pillTxt, active && s.pillTxtActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Contenido ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#FF5E00" size="large" />
        </View>

      ) : error ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={44} color="#222" />
          <Text style={s.emptyTxt}>No se pudo conectar con el servidor.</Text>
        </View>

      ) : (
        <FlatList
          data={filteredReservas}
          keyExtractor={(item, index) => String(item.reservationId ?? item.id ?? index)}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.center}>
              <MaterialCommunityIcons name="account-group-outline" size={56} color="#1a1a1a" />
              <Text style={s.emptyTxt}>
                {activeFilter === 'Todos'
                  ? 'Aún no hay alumnos con reservas en tus clases.'
                  : `Sin alumnos para el filtro "${activeFilter}".`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const name        = clientName(item);
            const claseNombre = item.activityName ?? item.className ?? activityName ?? '—';
            const horario     = (item.startTime && item.endTime)
              ? `${fmt5(item.startTime)} - ${fmt5(item.endTime)}`
              : timeRange !== '—' ? timeRange : '—';
            const reservadoEl = fmtDate(
              item.reservationDate ?? item.createdAt ?? item.date ?? item.reservedAt,
            );

            return (
              <View style={s.card}>

                {/* Fila 1 — Nombre del cliente */}
                <View style={s.row}>
                  <Feather name="user" size={15} color="#38BDF8" />
                  <Text style={s.clientName} numberOfLines={1}>{name}</Text>
                </View>

                <View style={s.divider} />

                {/* Fila 2 — Nombre de la clase */}
                <View style={s.row}>
                  <Feather name="activity" size={14} color="#888" />
                  <Text style={s.rowLabel}>Clase: </Text>
                  <Text style={s.rowValue} numberOfLines={1}>{claseNombre}</Text>
                </View>

                {/* Fila 3 — Horario */}
                <View style={s.row}>
                  <Feather name="clock" size={14} color="#888" />
                  <Text style={s.rowLabel}>Horario: </Text>
                  <Text style={s.rowValue}>{horario}</Text>
                </View>

                {/* Fila 4 — Fecha de reserva */}
                <View style={s.row}>
                  <Feather name="calendar" size={14} color="#888" />
                  <Text style={s.rowLabel}>Reservado el: </Text>
                  <Text style={s.rowValue}>{reservadoEl}</Text>
                </View>

              </View>
            );
          }}
        />
      )}

    </SafeAreaView>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 40 },

  /* Header */
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  backBtn:    { width: 40, height: 40, backgroundColor: '#1C1C1E', borderRadius: 12, borderWidth: 1, borderColor: '#3A3A3C', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  headerInfo: { flex: 1, gap: 3 },
  headerTitle:{ color: '#fff', fontSize: 17, fontWeight: '900' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTime: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  headerDot:  { color: '#333', fontSize: 12 },
  headerCount:{ color: '#555', fontSize: 12 },

  /* Filtros */
  filtersScroll: { flexGrow: 0, flexShrink: 0 },
  filtersRow:    { paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  pill:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: '#2A2A2D', alignSelf: 'flex-start' },
  pillActive:    { backgroundColor: '#FF5E00' },
  pillTxt:       { color: '#888', fontSize: 13, fontWeight: '700' },
  pillTxtActive: { color: '#fff' },

  /* Lista */
  list: { padding: 16, paddingBottom: 48, gap: 12 },

  /* Tarjeta */
  card:    { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 16, gap: 10 },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 2 },

  clientName: { color: '#38BDF8', fontSize: 16, fontWeight: '800', flex: 1 },

  row:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { color: '#555', fontSize: 13 },
  rowValue: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },

  emptyTxt: { color: '#444', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
