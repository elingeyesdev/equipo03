/**
 * StaffMapScreen — Mapa exclusivo para roles de staff (GERENTE, INSTRUCTOR, ENTRENADOR, PERSONAL_DE_LIMPIEZA).
 * Muestra ÚNICAMENTE las sucursales de la marca a la que pertenece la cuenta del usuario.
 * No toca ni comparte código con el MapScreen de CLIENTE.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../app/Shared/hooks/useAuth';
import authAxios from '../../../../app/Providers/auth/authAxios';
import { OSMConfig } from '../../../../app/Providers/geolocation/config/osm.config';

// ─── Tipos internos ────────────────────────────────────────────────────────────
interface StaffGym {
  id: number;
  name: string;
  parentId?: number | null;
  parentName?: string | null;
  aforoActual?: number;
  maxCapacity?: number;
  isOpen?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const INITIAL_REGION = OSMConfig.defaults.initialRegion;
const DELTA = 0.06;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function unwrap(res: any): any {
  const d = res?.data;
  if (d && typeof d === 'object' && 'success' in d && 'data' in d) return d.data;
  return d;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export const StaffMapScreen: React.FC = () => {
  const navigation   = useNavigation<any>();
  const { user }     = useAuth();
  const mapRef       = useRef<MapView>(null);

  const [gyms,      setGyms]      = useState<StaffGym[]>([]);
  const [brandName, setBrandName] = useState<string>('Tu Marca');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // ─── Carga de datos ─────────────────────────────────────────────────────────
  const loadBrandGyms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const gymId = user?.gymId ? Number(user.gymId) : null;
      if (!gymId) {
        setError('Tu cuenta no tiene una sucursal asignada.\nContacta al administrador.');
        return;
      }

      // Paso 1 — Obtener la sucursal propia para extraer parentId (marca)
      const ownRes  = await authAxios.get(`/api/gyms/${gymId}`, { timeout: 10000 });
      const ownGym  = unwrap(ownRes) as StaffGym & { parent?: { name?: string } };
      const brandId = ownGym?.parentId ?? null;
      const brand   = ownGym?.parentName ?? (ownGym as any)?.parent?.name ?? 'Mi Marca';
      setBrandName(brand);

      if (!brandId) {
        // La sucursal no tiene marca padre — mostramos solo la propia
        setGyms(ownGym?.location ? [ownGym] : []);
        return;
      }

      // Paso 2 — Obtener TODAS las sedes (backend filtra por marca si JWT es de staff)
      const allRes  = await authAxios.get('/api/gyms', { timeout: 10000 });
      const allList = unwrap(allRes);
      const all: StaffGym[] = Array.isArray(allList) ? allList : [];

      // Paso 3 — Filtro cliente: conservar solo sucursales de la misma marca
      //          (doble seguridad en caso de que el backend no filtre)
      const brandGyms = all.filter(
        (g) => g.parentId != null && Number(g.parentId) === Number(brandId),
      );

      // Si el filtro quedó vacío (e.g. backend no devolvió parentId), mostramos la propia
      setGyms(brandGyms.length > 0 ? brandGyms : (ownGym?.location ? [ownGym] : []));
    } catch (e: any) {
      console.error('[StaffMapScreen] Error cargando sucursales:', e?.message);
      setError('No se pudieron cargar las sucursales.\nVerifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [user?.gymId]);

  useEffect(() => {
    loadBrandGyms();
  }, [loadBrandGyms]);

  // Centrar el mapa en la primera sede con coordenadas válidas
  useEffect(() => {
    if (gyms.length === 0) return;
    const first = gyms.find(g => g.location?.latitude && g.location?.longitude);
    if (!first?.location) return;
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion({
        latitude:      first.location!.latitude,
        longitude:     first.location!.longitude,
        latitudeDelta:  DELTA,
        longitudeDelta: DELTA,
      }, 800);
    }, 400);
    return () => clearTimeout(timer);
  }, [gyms]);

  // ─── Estados especiales ──────────────────────────────────────────────────────
  const Header = (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
      </TouchableOpacity>
      <View style={s.headerMid}>
        <Text style={s.headerBrand} numberOfLines={1}>{brandName}</Text>
        <Text style={s.headerSub}>
          {loading ? 'Cargando...' : `${gyms.length} sucursal${gyms.length !== 1 ? 'es' : ''}`}
        </Text>
      </View>
      <TouchableOpacity style={s.reloadBtn} onPress={loadBrandGyms} disabled={loading}>
        <MaterialCommunityIcons
          name={loading ? 'loading' : 'refresh'}
          size={18}
          color={loading ? '#444' : '#f05b22'}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        {Header}
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
          <Text style={s.centerTxt}>Cargando sucursales de tu marca...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        {Header}
        <View style={s.center}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={52} color="#444" />
          <Text style={s.centerTxt}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadBrandGyms}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Mapa principal ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {Header}

      {/* Pill informativo con el total */}
      <View style={s.infoPill}>
        <MaterialCommunityIcons name="office-building-marker" size={14} color="#f05b22" />
        <Text style={s.infoPillTxt}>
          {gyms.length} sucursal{gyms.length !== 1 ? 'es' : ''} de <Text style={{ color: '#f05b22', fontWeight: '800' }}>{brandName}</Text>
        </Text>
      </View>

      <View style={s.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          pitchEnabled={false}
        >
          {/* Tiles OpenStreetMap */}
          <UrlTile
            urlTemplate={OSMConfig.tileUrlTemplate}
            maximumZ={OSMConfig.tiles.maximumZ}
            flipY={OSMConfig.tiles.flipY}
            tileSize={OSMConfig.tiles.tileSize}
          />

          {/* Marcadores — una por sucursal de la marca */}
          {gyms.map((gym) => {
            const lat = gym.location?.latitude;
            const lng = gym.location?.longitude;
            if (!lat || !lng || (lat === 0 && lng === 0)) return null;

            const isUserGym = Number(gym.id) === Number(user?.gymId);
            const isClosed  = gym.isOpen === false;
            const aforo     = gym.aforoActual ?? 0;
            const maxCap    = gym.maxCapacity ?? 100;
            const pct       = maxCap > 0 ? Math.round((aforo / maxCap) * 100) : 0;

            // Prioridad de color: cerrada > tu sucursal > lleno > disponible
            const pinColor = isClosed
              ? '#8e8e93'
              : isUserGym
              ? '#f05b22'
              : pct > 70
              ? '#e74c3c'
              : '#2ecc71';

            return (
              <Marker
                key={gym.id}
                coordinate={{ latitude: lat, longitude: lng }}
                pinColor={pinColor}
                zIndex={isUserGym ? 999 : 1}
              >
                <Callout tooltip>
                  <View style={s.callout}>
                    <View style={s.calloutBadgeRow}>
                      {isUserGym && (
                        <View style={s.myGymBadge}>
                          <Text style={s.myGymBadgeTxt}>Tu sucursal</Text>
                        </View>
                      )}
                      {isClosed && (
                        <View style={s.closedBadge}>
                          <MaterialCommunityIcons name="clock-remove-outline" size={10} color="#8e8e93" />
                          <Text style={s.closedBadgeTxt}>Cerrada ahora</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.calloutName} numberOfLines={2}>{gym.name}</Text>
                    {!!gym.location?.address && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialCommunityIcons name="map-marker-outline" size={11} color="#888" />
                        <Text style={s.calloutAddr} numberOfLines={1}>{gym.location.address}</Text>
                      </View>
                    )}
                    {!isClosed && (
                      <>
                        <View style={s.calloutAforoRow}>
                          <MaterialCommunityIcons name="account-group" size={12} color="#aaa" />
                          <Text style={s.calloutAforoTxt}>
                            {aforo}/{maxCap} ({pct}% ocupación)
                          </Text>
                        </View>
                        <View style={[s.calloutBar, { backgroundColor: '#1a1a1a' }]}>
                          <View
                            style={[
                              s.calloutBarFill,
                              { width: `${Math.min(pct, 100)}%`, backgroundColor: pinColor },
                            ]}
                          />
                        </View>
                      </>
                    )}
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Atribución OSM */}
        <View style={s.attribution}>
          <Text style={s.attributionTxt}>{OSMConfig.attribution}</Text>
        </View>

        {/* Leyenda */}
        <View style={s.legend}>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: '#f05b22' }]} />
            <Text style={s.legendTxt}>Tu sucursal</Text>
          </View>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: '#2ecc71' }]} />
            <Text style={s.legendTxt}>Disponible</Text>
          </View>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: '#e74c3c' }]} />
            <Text style={s.legendTxt}>Lleno</Text>
          </View>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: '#8e8e93' }]} />
            <Text style={s.legendTxt}>Cerrada</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#222',
    justifyContent: 'center', alignItems: 'center',
  },
  reloadBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#222',
    justifyContent: 'center', alignItems: 'center',
  },
  headerMid:   { flex: 1 },
  headerBrand: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerSub:   { color: '#f05b22', fontSize: 11, fontWeight: '600', marginTop: 1 },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 36 },
  centerTxt: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn:  { backgroundColor: '#f05b22', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  retryTxt:  { color: '#fff', fontWeight: '700', fontSize: 14 },

  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginVertical: 8,
    backgroundColor: '#111', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#222',
    alignSelf: 'flex-start',
  },
  infoPillTxt: { color: '#aaa', fontSize: 12 },

  mapWrap: { flex: 1, position: 'relative' },

  attribution: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  attributionTxt: { color: '#aaa', fontSize: 9 },

  legend: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#0A0A0A',
    borderRadius: 12, padding: 10, gap: 6,
    borderWidth: 1, borderColor: '#222',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { color: '#ccc', fontSize: 11, fontWeight: '600' },

  callout: {
    backgroundColor: '#111', borderRadius: 12, padding: 12,
    minWidth: 190, maxWidth: 240,
    borderWidth: 1, borderColor: '#2a2a2a',
    gap: 4,
  },
  calloutBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  myGymBadge: {
    backgroundColor: '#1C1C1E', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: '#FF5E00',
    alignSelf: 'flex-start',
  },
  myGymBadgeTxt: { color: '#f05b22', fontSize: 10, fontWeight: '700' },
  closedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#1C1C1E', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: '#8e8e93',
    alignSelf: 'flex-start',
  },
  closedBadgeTxt: { color: '#8e8e93', fontSize: 10, fontWeight: '700' },
  calloutName:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  calloutAddr:   { color: '#888', fontSize: 11 },
  calloutAforoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calloutAforoTxt: { color: '#aaa', fontSize: 11 },
  calloutBar: { height: 4, borderRadius: 2, width: '100%', overflow: 'hidden', marginTop: 2 },
  calloutBarFill: { height: '100%', borderRadius: 2 },
});
