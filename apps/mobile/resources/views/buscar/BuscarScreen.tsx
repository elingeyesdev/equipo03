import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BuscarStackParamList } from '../../../routes/BuscarStack';
import { OSMConfig } from '../../../app/Providers/geolocation/config/osm.config';
import { useMapScreenStore } from '../../../app/Http/Controllers/geolocation/MapScreen.Controller';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { LeafletMapView } from '../../../app/Providers/geolocation/components/LeafletMap/LeafletMapView';
import { visitsApi, VisitRecord } from '../../../app/Providers/geolocation/services/visits.api';
import { reservationApi } from '../../../app/Providers/reservations/api/reservation.api';

const STAFF_ROLES = new Set(['GERENTE', 'INSTRUCTOR', 'ENTRENADOR', 'PERSONAL_DE_LIMPIEZA', 'NUTRICIONISTA']);

const { width } = Dimensions.get('window');

const C = {
  bg: '#0A0A0A', surface: '#1C1C1E', border: '#2A2A2C',
  orange: '#FF5E00', celeste: '#38BDF8', green: '#34C759',
  white: '#FFFFFF', soft: '#888', dim: '#555',
};

const DOW_LABELS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

type Nav = NativeStackNavigationProp<BuscarStackParamList, 'BuscarHome'>;

export const BuscarScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [lastVisit, setLastVisit] = useState<VisitRecord | null | undefined>(undefined);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const isStaff = STAFF_ROLES.has(user?.role ?? '');
  const mapaRoute: keyof BuscarStackParamList = isStaff ? 'StaffMapa' : 'Mapa';

  useEffect(() => {
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then(pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    visitsApi.getMyVisits()
      .then(visits => setLastVisit(visits.length > 0 ? visits[0] : null))
      .catch(() => setLastVisit(null));
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const todayDow = DOW_LABELS[new Date().getDay()];
        const activities = await reservationApi.getGymActivities(0).catch(() => []);
        const withSchedules = activities.filter(
          (a: any) => !a.isFreeAccess && a.schedules?.some((s: any) => s.dayOfWeek === todayDow),
        );
        setTodayClasses(withSchedules.slice(0, 6));
      } catch {
        setTodayClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        removeClippedSubviews={false}
      >
        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.title}>Buscar</Text>
          <TouchableOpacity
            style={s.historialBtn}
            onPress={() => navigation.navigate('Historial')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="history" size={18} color={C.white} />
            <Text style={s.historialTxt}>Historial</Text>
          </TouchableOpacity>
        </View>

        {/* ── Mapa preview ── */}
        <View style={s.sectionRow}>
          <MaterialCommunityIcons name="map-marker" size={20} color={C.orange} />
          <Text style={s.sectionTitle}>Sucursales cerca de ti</Text>
        </View>

        <View style={s.mapWrap}>
          <LeafletMapView
            mode="preview"
            sedes={[]}
            userLocation={userLoc}
            initialCenter={
              userLoc
                ? { lat: userLoc.lat, lng: userLoc.lng }
                : { lat: OSMConfig.defaults.initialRegion.latitude, lng: OSMConfig.defaults.initialRegion.longitude }
            }
            initialZoom={14}
            interactive={false}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={0.9}
            onPress={() => {
              if (!isStaff) useMapScreenStore.setState({ isListView: false });
              navigation.navigate(mapaRoute);
            }}
          />
          <View style={s.mapBar} pointerEvents="none">
            <View style={s.mapPill}>
              <MaterialCommunityIcons name="map-search-outline" size={14} color={C.white} />
              <Text style={s.mapPillTxt}>Ver mapa interactivo</Text>
            </View>
          </View>
        </View>

        {/* ── Clases disponibles hoy ── */}
        <View style={[s.sectionRow, { marginTop: 28 }]}>
          <MaterialCommunityIcons name="calendar-today" size={20} color={C.celeste} />
          <Text style={s.sectionTitle}>Clases disponibles hoy</Text>
        </View>

        {loadingClasses ? (
          <ActivityIndicator color={C.orange} style={{ marginTop: 16 }} />
        ) : todayClasses.length === 0 ? (
          <View style={s.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={24} color={C.dim} />
            <Text style={s.emptyTxt}>No hay clases programadas para hoy cerca de ti</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.classesScroll}>
            {todayClasses.map((cls: any) => {
              const schedule = cls.schedules?.[0];
              const start = schedule?.startTime?.substring(0, 5) ?? '';
              const end = schedule?.endTime?.substring(0, 5) ?? '';
              const gymName = cls.gym?.name ?? '';
              return (
                <View key={cls.id} style={s.classCard}>
                  <Text style={s.className} numberOfLines={1}>{cls.name}</Text>
                  {gymName ? <Text style={s.classGym} numberOfLines={1}>{gymName}</Text> : null}
                  <View style={s.classTimeRow}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color={C.celeste} />
                    <Text style={s.classTime}>{start} – {end}</Text>
                  </View>
                  {cls.defaultDurationMin && (
                    <Text style={s.classDuration}>{cls.defaultDurationMin} min</Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ── Última sucursal visitada ── */}
        <View style={[s.sectionRow, { marginTop: 28 }]}>
          <MaterialCommunityIcons name="map-marker-check" size={20} color={C.green} />
          <Text style={s.sectionTitle}>Última sucursal visitada</Text>
        </View>

        {lastVisit === undefined ? (
          <ActivityIndicator color={C.orange} style={{ marginTop: 16 }} />
        ) : lastVisit === null ? (
          <View style={s.emptyCard}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={24} color={C.dim} />
            <Text style={s.emptyTxt}>No has visitado sucursales recientemente</Text>
          </View>
        ) : (
          <View style={s.visitCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.visitName}>{lastVisit.gym?.name ?? 'Sucursal'}</Text>
              {lastVisit.gym?.location?.address && (
                <Text style={s.visitAddr} numberOfLines={1}>{lastVisit.gym.location.address}</Text>
              )}
              <Text style={s.visitDate}>
                {new Date(lastVisit.enteredAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}
                {lastVisit.durationMin ? ` · ${lastVisit.durationMin} min` : ''}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={C.dim} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 100 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: C.white },
  historialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.surface, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 18,
  },
  historialTxt: { color: C.white, fontSize: 13, fontWeight: '600' },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  mapWrap: {
    marginHorizontal: 20, marginTop: 10, height: 200, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, overflow: 'hidden',
  },
  mapBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 44,
    backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center',
  },
  mapPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
  },
  mapPillTxt: { color: C.white, fontWeight: '600', fontSize: 12 },
  classesScroll: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  classCard: {
    width: 160, backgroundColor: C.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  className: { color: C.white, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  classGym: { color: C.soft, fontSize: 11, marginBottom: 8 },
  classTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  classTime: { color: C.celeste, fontSize: 12, fontWeight: '600' },
  classDuration: { color: C.dim, fontSize: 11, marginTop: 4 },
  emptyCard: {
    marginHorizontal: 20, marginTop: 12, backgroundColor: C.surface, borderRadius: 12,
    padding: 20, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.border,
  },
  emptyTxt: { color: C.dim, fontSize: 13, textAlign: 'center' },
  visitCard: {
    marginHorizontal: 20, marginTop: 12, backgroundColor: C.surface, borderRadius: 12,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  visitName: { color: C.white, fontSize: 15, fontWeight: '700' },
  visitAddr: { color: C.soft, fontSize: 12, marginTop: 2 },
  visitDate: { color: C.dim, fontSize: 11, marginTop: 4 },
});
