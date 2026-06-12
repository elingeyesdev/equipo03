import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { OSMConfig } from '../../../app/Providers/geolocation/config/osm.config';
import authAxios from '../../../app/Providers/auth/authAxios';

const DELTA = 0.008;

export const VisitedGymMapScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { gymId, name, latitude: paramLat, longitude: paramLng } = route.params;

  const mapRef = useRef<MapView>(null);
  const [lat, setLat]       = useState<number | null>(paramLat ?? null);
  const [lng, setLng]       = useState<number | null>(paramLng ?? null);
  const [loading, setLoad]  = useState(!paramLat || !paramLng);
  const [error, setError]   = useState<string | null>(null);

  // Si no vienen coordenadas (visita activa local) las fetcheamos
  useEffect(() => {
    if (paramLat && paramLng) return;
    (async () => {
      try {
        const res = await authAxios.get(`/api/gyms/${gymId}`, { timeout: 8000 });
        const g = res.data?.data ?? res.data;
        const fetchedLat = g?.location?.latitude ?? g?.coordenadas?.latitude;
        const fetchedLng = g?.location?.longitude ?? g?.coordenadas?.longitude;
        if (fetchedLat && fetchedLng) {
          setLat(fetchedLat);
          setLng(fetchedLng);
        } else {
          setError('No se encontraron coordenadas para esta marca.');
        }
      } catch {
        setError('No se pudo obtener la ubicación de la marca.');
      } finally {
        setLoad(false);
      }
    })();
  }, [gymId, paramLat, paramLng]);

  // Centrar en la sede cuando las coords estén listas
  useEffect(() => {
    if (!lat || !lng) return;
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: DELTA, longitudeDelta: DELTA },
        800,
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [lat, lng]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.headerTitle} numberOfLines={1}>{name}</Text>
          <Text style={s.headerSub}>Marca visitada</Text>
        </View>
        <View style={s.headerRight} />
      </View>

      {/* Estado de carga / error */}
      {loading && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color="#f05b22" />
          <Text style={s.overlayTxt}>Cargando ubicación…</Text>
        </View>
      )}

      {!loading && error && (
        <View style={s.overlay}>
          <MaterialCommunityIcons name="map-marker-off-outline" size={52} color="#444" />
          <Text style={s.overlayTxt}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={s.retryTxt}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mapa (solo si hay coordenadas) */}
      {!loading && !error && lat && lng && (
        <View style={s.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude:       lat,
              longitude:      lng,
              latitudeDelta:  DELTA,
              longitudeDelta: DELTA,
            }}
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

            {/* Marcador naranja de la sede visitada */}
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor="#f05b22"
              title={name}
              description="Marca visitada"
              zIndex={999}
            >
              <Callout tooltip>
                <View style={s.callout}>
                  <View style={s.calloutBadge}>
                    <MaterialCommunityIcons name="map-marker-check" size={14} color="#f05b22" />
                    <Text style={s.calloutBadgeTxt}>Marca visitada</Text>
                  </View>
                  <Text style={s.calloutName}>{name}</Text>
                </View>
              </Callout>
            </Marker>
          </MapView>

          {/* Atribución OSM */}
          <View style={s.attribution}>
            <Text style={s.attributionTxt}>{OSMConfig.attribution}</Text>
          </View>

          {/* Leyenda naranja */}
          <View style={s.legend}>
            <View style={s.legendDot} />
            <Text style={s.legendTxt}>{name}</Text>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

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
  headerMid:   { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerSub:   { color: '#f05b22', fontSize: 11, fontWeight: '600', marginTop: 1 },
  headerRight: { width: 40 },

  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 40,
  },
  overlayTxt: { color: '#555', fontSize: 14, textAlign: 'center' },
  retryBtn:   { backgroundColor: '#f05b22', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  retryTxt:   { color: '#fff', fontWeight: '700', fontSize: 14 },

  mapWrap: { flex: 1, position: 'relative' },

  attribution: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  attributionTxt: { color: '#aaa', fontSize: 9 },

  legend: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0A0A0A',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#f05b22',
  },
  legendDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#f05b22' },
  legendTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  callout: {
    backgroundColor: '#111', borderRadius: 12, padding: 12,
    minWidth: 180, borderWidth: 1, borderColor: '#FF5E00',
  },
  calloutBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: 6,
  },
  calloutBadgeTxt: { color: '#f05b22', fontSize: 11, fontWeight: '700' },
  calloutName:     { color: '#fff', fontSize: 14, fontWeight: '800' },
});
