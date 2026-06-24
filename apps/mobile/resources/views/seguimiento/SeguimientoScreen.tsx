import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { staffApi, ActiveAdvisee } from '../../../app/Providers/staff/api/staff.api';
import { useAuth } from '../../../app/Shared/hooks/useAuth';

// Paleta rotativa de colores por cliente
const AVATAR_PALETTE = ['#FF5E00', '#38BDF8', '#00E5A3'];
const avatarColor = (idx: number) => AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
const avatarBg    = (idx: number) => [`#3a1800`, `#0d2a3d`, `#003d2a`][idx % 3];

// ─── Card ─────────────────────────────────────────────────────────────────────
const ClientCard = ({
  item, index,
  onHistory, onProfile,
}: {
  item: ActiveAdvisee; index: number;
  onHistory: () => void; onProfile: () => void;
}) => {
  const color   = avatarColor(index);
  const bgColor = avatarBg(index);
  const initial = (item.clientName ?? '?').charAt(0).toUpperCase();

  return (
    <View style={[s.card, { borderColor: color + '33' }]}>
      {/* ── Fila superior ── */}
      <View style={s.cardTop}>
        {/* Avatar */}
        <View style={[s.avatar, { backgroundColor: bgColor, borderColor: color }]}>
          <Text style={[s.avatarTxt, { color }]}>{initial}</Text>
        </View>

        {/* Info principal */}
        <View style={s.infoCol}>
          <Text style={s.clientName}>{item.clientName}</Text>

          {/* Badge estado */}
          <View style={s.activeBadge}>
            <View style={s.activeDot} />
            <Text style={s.activeTxt}>Asesoría Activa</Text>
          </View>

          {/* Teléfono */}
          <View style={s.phoneRow}>
            <MaterialCommunityIcons
              name="phone-outline" size={13}
              color={item.phone ? '#555' : '#2a2a2a'}
            />
            <Text style={item.phone ? s.phoneVal : s.phoneEmpty}>
              {item.phone ?? 'Sin teléfono registrado'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Separador ── */}
      <View style={s.divider} />

      {/* ── Acciones ── */}
      <View style={s.actionRow}>
        <TouchableOpacity style={[s.actionBtn, s.histBtn]} activeOpacity={0.8} onPress={onHistory}>
          <MaterialCommunityIcons name="chart-line" size={16} color="#38BDF8" />
          <Text style={s.histBtnTxt}>Historial</Text>
        </TouchableOpacity>

        <View style={s.actionDivider} />

        <TouchableOpacity style={[s.actionBtn, s.profileBtn]} activeOpacity={0.8} onPress={onProfile}>
          <MaterialCommunityIcons name="account-details-outline" size={16} color="#FF5E00" />
          <Text style={s.profileBtnTxt}>Ver Perfil</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const SeguimientoScreen = () => {
  const navigation   = useNavigation<any>();
  const { user }     = useAuth();
  const isInstructor = ((user as any)?.level ?? 0) === 2;

  const [clients,    setClients]    = useState<ActiveAdvisee[]>([]);
  const [isLoading,  setIsLoading]  = useState(!isInstructor);
  const [isError,    setIsError]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (isInstructor) return;
    setIsError(false);
    try {
      const raw = await staffApi.getActiveAdvisees();
      setClients(Array.isArray(raw) ? raw : ((raw as any)?.data ?? []));
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isInstructor]);

  useEffect(() => { load(); }, [load]);

  function handleRefresh() {
    setRefreshing(true);
    load();
  }

  // ── Vista para INSTRUCTOR: sin clientes 1:1, solo reporte de clases ──────────
  if (isInstructor) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}>
          <View>
            <Text style={s.topTitle}>Seguimiento</Text>
            <Text style={s.topSub}>Gestión de clases grupales</Text>
          </View>
          <View style={[s.topBadge, { backgroundColor: '#1a2600', borderColor: '#FF5E0044' }]}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={22} color="#FF5E00" />
          </View>
        </View>

        <TouchableOpacity
          style={s.reportRow}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('InstructorReport')}
        >
          <MaterialCommunityIcons name="file-pdf-box" size={16} color="#FF5E00" />
          <Text style={s.reportRowTxt}>Generar Reporte de Clases</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#333" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <View style={s.center}>
          <MaterialCommunityIcons name="whistle-outline" size={56} color="#1a1a1a" />
          <Text style={s.emptyTitle}>Tus clases grupales</Text>
          <Text style={s.emptySubTxt}>
            Genera un reporte PDF de asistencia y aforo de tus horarios desde el acceso rápido de arriba.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Vista para ENTRENADOR / NUTRICIONISTA: lista de clientes asesorados ───────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topBar}>
        <View>
          <Text style={s.topTitle}>Seguimiento</Text>
          {!isLoading && clients.length > 0 && (
            <Text style={s.topSub}>{clients.length} cliente{clients.length !== 1 ? 's' : ''} activo{clients.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <View style={s.topBadge}>
          <MaterialCommunityIcons name="chart-areaspline" size={22} color="#38BDF8" />
        </View>
      </View>

      <TouchableOpacity
        style={s.reportRow}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('TrainerReport')}
      >
        <MaterialCommunityIcons name="file-pdf-box" size={16} color="#FF5E00" />
        <Text style={s.reportRowTxt}>Generar Reporte de Clientes</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#333" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      ) : isError ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#222" />
          <Text style={s.emptyTitle}>Error de conexión</Text>
          <Text style={s.emptySubTxt}>No se pudo cargar tus clientes.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : clients.length === 0 ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="account-group-outline" size={56} color="#1a1a1a" />
          <Text style={s.emptyTitle}>Sin clientes activos</Text>
          <Text style={s.emptySubTxt}>
            Aquí verás a los clientes con asesoría activa contigo. Acepta solicitudes desde tu panel de inicio.
          </Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#38BDF8"
              colors={['#38BDF8']}
            />
          }
          renderItem={({ item, index }) => (
            <ClientCard
              item={item}
              index={index}
              onHistory={() =>
                navigation.navigate('HistorialRutina', {
                  clientId:   item.clientId,
                  clientName: item.clientName,
                  phone:      item.phone,
                })
              }
              onProfile={() =>
                navigation.navigate('PerfilAlumno', {
                  clientId:   item.clientId,
                  clientName: item.clientName,
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  list:   { padding: 16, paddingBottom: 110 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 32 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  topTitle:  { color: '#fff', fontSize: 24, fontWeight: '900' },
  topSub:    { color: '#444', fontSize: 13, marginTop: 2 },
  topBadge:  {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#0d2a3d', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#38BDF844',
  },

  reportRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#111',
    backgroundColor: '#050505',
  },
  reportRowTxt: { color: '#FF5E00', fontSize: 13, fontWeight: '700' },

  // ── Card ──
  card: {
    backgroundColor: '#0c0c0c', borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 16, gap: 14,
  },

  // ── Avatar ──
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2,
  },
  avatarTxt: { fontSize: 22, fontWeight: '900' },

  // ── Info ──
  infoCol: { flex: 1, gap: 6 },
  clientName: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },

  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#003d2a', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#00E5A333',
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00E5A3' },
  activeTxt: { color: '#00E5A3', fontSize: 12, fontWeight: '700' },

  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  phoneVal:   { color: '#555', fontSize: 13 },
  phoneEmpty: { color: '#2a2a2a', fontSize: 13, fontStyle: 'italic' },

  divider: { height: 1, backgroundColor: '#1a1a1a', marginHorizontal: 0 },

  // ── Actions ──
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 14,
  },
  actionDivider: { width: 1, height: 24, backgroundColor: '#1a1a1a' },

  histBtn:        {},
  histBtnTxt:     { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
  profileBtn:     {},
  profileBtnTxt:  { color: '#FF5E00', fontSize: 13, fontWeight: '700' },
  rutinaBtn:      {},
  rutinaBtnTxt:   { color: '#00E5A3', fontSize: 13, fontWeight: '700' },

  // ── Empty / Error ──
  emptyTitle:  { color: '#555', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySubTxt: { color: '#333', fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  retryBtn:    { backgroundColor: '#1C1C1E', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: '#38BDF844' },
  retryTxt:    { color: '#38BDF8', fontWeight: '700', fontSize: 14 },
});
