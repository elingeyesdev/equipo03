import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AlertaBanner } from '../alertas/AlertaBanner';
import { useNavigation } from '@react-navigation/native';
import { SedeConDistancia } from '@gymsync/core';
import { GeolocationModule } from '../../../app/Providers/GeolocationModule.container';
import { useMapScreenStore } from '../../../app/Http/Controllers/geolocation/MapScreen.Controller';
import { useFilterStore } from '../../../app/Providers/geolocation/stores/FilterStore';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { ManagerDashboard } from './ManagerDashboard';
import { TrainerDashboard } from './TrainerDashboard';
import { NutritionistDashboard } from './NutritionistDashboard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.45;

const GALLERY_ICONS: Array<{ icon: string; color: string; label: string }> = [
  { icon: 'run', color: '#e94560', label: 'Running' },
  { icon: 'bike', color: '#f05b22', label: 'Ciclismo' },
  { icon: 'yoga', color: '#00b4d8', label: 'Yoga' },
  { icon: 'rowing', color: '#06d6a0', label: 'Remo' },
  { icon: 'weight-lifter', color: '#9b5de5', label: 'Pesas' },
  { icon: 'swim', color: '#0077b6', label: 'Natación' },
  { icon: 'basketball', color: '#ef476f', label: 'Basket' },
  { icon: 'kabaddi', color: '#ffd166', label: 'MMA' },
  { icon: 'gymnastics', color: '#06d6a0', label: 'Gimnasia' },
];

// ─── Placeholders para roles no-cliente ──────────────────────────────────────

const ph = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 14 },
  title:  { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub:    { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

// ─── Dashboard del cliente (lógica intacta) ───────────────────────────────────

const ClientDashboard = () => {
  const navigation = useNavigation<any>();
  const [sedes, setSedes] = useState<SedeConDistancia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSedes = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const { obtenerSedesCercanasUseCase } = GeolocationModule.provideUseCases();
      // Aumentamos el rango para asegurar que aparezcan datos reales (50km)
      const result = await obtenerSedesCercanasUseCase.execute({ maxResultados: 10, radioKm: 50 });
      if (result.isRight()) {
        setSedes(result.value.sedes);
      }
    } catch (e) {
      console.error('[InicioScreen] Error fetching sedes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSedes();
  }, [fetchSedes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSedes(true);
  };

  const getRandomColor = (index: number) => {
    const colors = ['#1a1a2e', '#162447', '#1b1b2f', '#0f3460', '#1c1c1e'];
    return colors[index % colors.length];
  };

  const getIconForGym = (servicios: string[]) => {
    if (!servicios || servicios.length === 0) return 'dumbbell';
    const s = servicios[0].toLowerCase();
    if (s.includes('crossfit')) return 'arm-flex';
    if (s.includes('yoga')) return 'yoga';
    if (s.includes('natación') || s.includes('pileta')) return 'swim';
    if (s.includes('boxeo')) return 'boxing-glove';
    return 'dumbbell';
  };

  const handleSedePress = (sede: any) => {
    navigation.navigate('Buscar', { sedeId: sede.id.value });
  };

  const handleDisciplinaPress = (disciplina: string) => {
    // Mapa de sinónimos para conectar los botones de la UI con los datos reales del backend
    const keywordMap: Record<string, string[]> = {
      'Running': ['running', 'cardio', 'caminadora', 'trotadora'],
      'Ciclismo': ['ciclismo', 'spinning', 'bicicleta', 'cardio'],
      'Yoga': ['yoga', 'pilates', 'estiramiento'],
      'Remo': ['remo', 'cardio', 'crossfit'],
      'Pesas': ['pesas', 'musculación', 'crossfit', 'funcional', 'halterofilia', 'fuerza'],
      'Natación': ['natación', 'piscina', 'pileta', 'acuático'],
      'Basket': ['basket', 'baloncesto', 'cancha', 'deportes'],
      'MMA': ['mma', 'artes marciales', 'boxeo', 'karate', 'taekwondo', 'judo', 'combate'],
      'Gimnasia': ['gimnasia', 'zumba', 'baile', 'aeróbicos', 'cardio'],
    };

    const searchTerms = keywordMap[disciplina] || [disciplina.toLowerCase()];

    const sedeEncontrada = sedes.find(item => {
      if (!item.sede.servicios) return false;
      // Verificamos si algún servicio del gimnasio coincide con alguna de nuestras palabras clave
      return item.sede.servicios.some(servicio =>
        searchTerms.some(term => servicio.toLowerCase().includes(term))
      );
    });

    if (sedeEncontrada) {
      useMapScreenStore.setState({ isListView: true });
      const matchedService = sedeEncontrada.sede.servicios?.find(s => searchTerms.some(term => s.toLowerCase().includes(term)));

      if (matchedService) {
         useFilterStore.getState().setFiltros({ servicios: [matchedService as any] });
      } else {
         useFilterStore.getState().resetFiltros();
      }

      navigation.navigate('Buscar');
    } else {
      Alert.alert(
        'Disciplina no disponible',
        `Lo sentimos, por el momento no hay sedes cercanas que ofrezcan ${disciplina}. ¡Prueba con otra opción!`,
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f05b22"
            colors={['#f05b22']}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bienvenido,</Text>
            <Text style={styles.title}>GymSync</Text>
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => {
              useMapScreenStore.setState({ isListView: true });
              navigation.navigate('Buscar');
            }}
          >
            <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Alerta de salud (banner automático) ── */}
        <AlertaBanner />

        {/* ── Gimnasios cerca de ti ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={28} color="#f05b22" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.sectionTitle}>Sedes cercanas</Text>
              <Text style={styles.sectionSubtitle}>Basado en tu ubicación actual</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => {
            useMapScreenStore.setState({ isListView: true });
            navigation.navigate('Buscar');
          }}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#f05b22" />
            <Text style={styles.loadingText}>Buscando sedes...</Text>
          </View>
        ) : sedes.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-off-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No hay sedes cercanas en este radio.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => onRefresh()}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sedes}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.sede.id.value.toString()}
            contentContainerStyle={styles.carouselContainer}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.gymCard}
                activeOpacity={0.8}
                onPress={() => handleSedePress(item.sede)}
              >
                <View style={[styles.gymCardImage, { backgroundColor: getRandomColor(index) }]}>
                  <MaterialCommunityIcons name={getIconForGym(item.sede.servicios) as any} size={48} color="#fff" />
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>
                      {item.distanciaKm !== undefined && item.distanciaKm !== null
                        ? `${Number(item.distanciaKm).toFixed(1)} km`
                        : 'N/A km'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.gymName} numberOfLines={1}>{item.sede.nombre}</Text>
                  <Text style={styles.gymAddress} numberOfLines={1}>
                    {item.sede.direccion || 'Sin dirección'}
                  </Text>
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#f05b22" />
                    <Text style={styles.ratingText}>{item.sede.rating || '4.5'}</Text>
                    <Text style={styles.capacityText}>
                      • {item.sede.aforoActual ?? 0}/{item.sede.aforoMax ?? 0}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* ── Tus primeros pasos con GymSync ── */}
        <View style={styles.onboardSection}>
          <View style={styles.sectionIconRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={26} color="#f05b22" />
            <Text style={[styles.sectionTitle, { marginLeft: 10 }]}>
              Explora Disciplinas
            </Text>
          </View>

          {/* Gallery grid */}
          <View style={styles.galleryGrid}>
            {GALLERY_ICONS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.galleryItem}
                activeOpacity={0.7}
                onPress={() => handleDisciplinaPress(item.label)}
              >
                <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
                <Text style={styles.galleryLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#f05b22" />
              <Text style={styles.infoText}>
                Agenda clases en cualquiera de las sedes afiliadas, observa tu progreso y
                no pierdas de vista tu bienestar.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Buscar')}
            >
              <Text style={styles.actionBtnText}>Buscar Clases Disponibles</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Enrutador por rol ────────────────────────────────────────────────────────

export const InicioScreen = () => {
  const { user } = useAuth();
  const role = user?.role ?? '';

  if (role === 'GERENTE' || role === 'COORDINADOR') return <ManagerDashboard />;
  if (role === 'INSTRUCTOR' || role === 'ENTRENADOR') return <TrainerDashboard />;
  if (role === 'NUTRICIONISTA') return <NutritionistDashboard />;
  if (role === 'PERSONAL_DE_LIMPIEZA') return (
    <SafeAreaView style={ph.safe} edges={['top']}>
      <View style={ph.center}>
        <MaterialCommunityIcons name="broom" size={56} color="#666" />
        <Text style={ph.title}>Panel de Limpieza</Text>
      </View>
    </SafeAreaView>
  );

  // Fallback intocable para USER / CLIENTE / sin rol
  return <ClientDashboard />;
};

// ─── Estilos del ClientDashboard ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  welcomeText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: -4,
  },
  searchBtn: {
    backgroundColor: '#1c1c1e',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  seeAllText: {
    color: '#f05b22',
    fontSize: 14,
    fontWeight: 'bold',
  },
  carouselContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 15,
  },
  gymCard: {
    width: CARD_WIDTH,
  },
  gymCardImage: {
    width: '100%',
    height: CARD_WIDTH * 0.8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  distanceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  distanceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardInfo: {
    paddingHorizontal: 4,
  },
  gymName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gymAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  capacityText: {
    fontSize: 12,
    color: '#666',
  },
  loadingState: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 14,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#444',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  retryBtn: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1c1c1e',
    borderRadius: 15,
  },
  retryBtnText: {
    color: '#f05b22',
    fontWeight: 'bold',
  },
  onboardSection: {
    paddingHorizontal: 20,
    marginTop: 35,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 10,
  },
  galleryItem: {
    width: (width - 40 - 30) / 4,
    height: 80,
    backgroundColor: '#161618',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  galleryLabel: {
    color: '#666',
    fontSize: 9,
    marginTop: 6,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#161618',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  infoContent: {
    flexDirection: 'row',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#999',
    lineHeight: 22,
  },
  actionBtn: {
    backgroundColor: '#f05b22',
    borderRadius: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
