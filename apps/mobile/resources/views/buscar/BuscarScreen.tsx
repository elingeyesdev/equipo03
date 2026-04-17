import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BuscarStackParamList } from '../../../routes/BuscarStack';
import MapView, { UrlTile } from 'react-native-maps';
import { OSMConfig } from '../../../app/Providers/geolocation/config/osm.config';

const { width } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_ITEM = (width - 40 - GRID_GAP) / 2;

type NavigationProp = NativeStackNavigationProp<BuscarStackParamList, 'Regresar'>;

const CATEGORIAS = [
  { label: 'Aerobicos', icon: 'run-fast', color: '#e94560' },
  { label: 'Aparatos', icon: 'weight-lifter', color: '#f05b22' },
  { label: 'Boxeo', icon: 'boxing-glove', color: '#9b5de5' },
  { label: 'Calistenia', icon: 'human-handsup', color: '#00b4d8' },
];

export const BuscarScreen = () => {
  const [query, setQuery] = useState('');
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Buscar</Text>
          <TouchableOpacity
            style={styles.historialBtn}
            onPress={() => navigation.navigate('Historial')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="history" size={20} color="#fff" />
            <Text style={styles.historialBtnText}>Historial</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesas, cardio, corredora, etc..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Explorar cerca de ti — abre el mapa real */}
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons name="map-marker" size={22} color="#f05b22" />
          <Text style={styles.sectionTitle}>Explorar cerca de ti</Text>
        </View>

        <TouchableOpacity
          style={styles.mapPlaceholderWrapper}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Mapa')}
        >
          <View pointerEvents="none" style={styles.mapPlaceholder}>
            <MapView
              style={StyleSheet.absoluteFillObject}
              initialRegion={OSMConfig.defaults.initialRegion}
              zoomEnabled={false}
              pitchEnabled={false}
              scrollEnabled={false}
              rotateEnabled={false}
              showsCompass={false}
            >
              <UrlTile
                urlTemplate={OSMConfig.tileUrlTemplate}
                maximumZ={OSMConfig.tiles.maximumZ}
                flipY={OSMConfig.tiles.flipY}
                tileSize={OSMConfig.tiles.tileSize}
              />
            </MapView>
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayText}>Toca para ver el mapa interactivo</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ¿Qué quieres entrenar hoy? */}
        <Text style={styles.categoriesTitle}>¿Que quieres entrenar hoy?</Text>

        <View style={styles.categoriesGrid}>
          {CATEGORIAS.map((cat, idx) => (
            <TouchableOpacity key={idx} style={styles.categoryCard} activeOpacity={0.8}>
              <View style={[styles.categoryIconBg, { backgroundColor: cat.color + '22' }]}>
                <MaterialCommunityIcons name={cat.icon as any} size={52} color={cat.color} />
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  historialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  historialBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mapPlaceholderWrapper: {
    marginHorizontal: 20,
    marginTop: 12,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: GRID_GAP,
  },
  categoryCard: {
    width: GRID_ITEM,
    height: GRID_ITEM,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  categoryIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
