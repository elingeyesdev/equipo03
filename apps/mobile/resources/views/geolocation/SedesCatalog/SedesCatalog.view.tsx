import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SedeConDistancia, Sede } from '@gymsync/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFilterStore } from '../../../../app/Providers/geolocation/stores/FilterStore';
import { FilterBottomSheet } from '../UI/FilterBottomSheet/FilterBottomSheet.component';

interface SedesCatalogProps {
  sedes: SedeConDistancia[];
  onSelectSede: (sede: Sede) => void;
  onCerrarCatalogo: () => void;
}

export const SedesCatalog: React.FC<SedesCatalogProps> = ({
  sedes,
  onSelectSede,
  onCerrarCatalogo
}) => {
  const [filterVisible, setFilterVisible] = React.useState(false);
  const { filtros, toggleServicio, toggleBeneficio } = useFilterStore();
  
  const activeFiltersCount = (filtros.servicios?.length || 0) + (filtros.beneficios?.length || 0);


  const renderAforoBar = (actual: number, maximo: number) => {
    const percentage = Math.min((actual / maximo) * 100, 100);
    const isFull = percentage >= 95;
    const barColor = isFull ? '#FF453A' : '#00E5A3'; // Rojo intenso o Verde Evolución
    
    return (
      <View style={styles.aforoContainer}>
        <View style={styles.aforoHeader}>
          <Text style={styles.aforoText}>Ocupación en vivo</Text>
          <Text style={[styles.aforoValue, {color: barColor}]}>{Math.round(percentage)}%</Text>
        </View>
        <View style={styles.aforoTrack}>
          <View style={[styles.aforoFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: SedeConDistancia }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => onSelectSede(item.sede)}
    >
      <ImageBackground 
        // TODO: Requerir este dato al backend — endpoint GET /gyms/:id debe devolver imagenUrl real
        source={item.sede.imagenUrl ? { uri: item.sede.imagenUrl } : require('../../../../assets/icon.png')}
        style={styles.cardImage}
        imageStyle={{ borderRadius: 28 }}
      >
        <View style={styles.cardOverlay}>
          <View style={styles.topRow}>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
              {/* TODO: Requerir rating y resenasCount al backend */}
              <Text style={styles.ratingText}>{item.sede.rating != null ? item.sede.rating.toFixed(1) : '-'}</Text>
              <Text style={styles.reviewCountText}>({item.sede.resenasCount ?? 0})</Text>
            </View>
            <View style={styles.distanceBadge}>
              <MaterialCommunityIcons name="map-marker-distance" size={12} color="#38BDF8" />
              <Text style={styles.distanceText}>{item.distancia.kmCorta}</Text>
            </View>
          </View>
          
          <View style={styles.bottomContent}>
             <Text style={styles.title} numberOfLines={1}>{item.sede.nombre}</Text>
             <Text style={styles.addressText} numberOfLines={1}>
               <MaterialCommunityIcons name="map-marker" size={12} color="#888" /> {item.sede.direccion}
             </Text>
             
             <View style={styles.chipsContainer}>
               {item.sede.servicios.slice(0, 3).map((servicio, index) => (
                 <View key={index} style={styles.chip}>
                   <Text style={styles.chipText}>{servicio}</Text>
                 </View>
               ))}
               {item.sede.servicios.length > 3 && (
                 <View style={styles.chipMore}>
                   <Text style={styles.chipMoreText}>+{item.sede.servicios.length - 3}</Text>
                 </View>
               )}
             </View>

             {renderAforoBar(item.sede.aforo.actual, item.sede.aforo.maximo)}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Explorar Sucursales</Text>
          
          {/* Active Filter Chips in Catalog */}
          {activeFiltersCount > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
              <View style={styles.activeFiltersRow}>
                {filtros.servicios?.map(servicio => (
                  <TouchableOpacity key={servicio} style={styles.activeFilterChip} onPress={() => toggleServicio(servicio)}>
                    <Text style={styles.activeFilterText}>{servicio}</Text>
                    <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                ))}
                {filtros.beneficios?.map(beneficio => (
                  <TouchableOpacity key={beneficio} style={styles.activeFilterChip} onPress={() => toggleBeneficio(beneficio)}>
                    <Text style={styles.activeFilterText}>{beneficio}</Text>
                    <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onCerrarCatalogo} activeOpacity={0.8}>
          <MaterialCommunityIcons name="map-outline" size={18} color="#FF5E00" style={{marginRight: 4}} />
          <Text style={styles.closeButtonText}>Mapa</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sedes}
        keyExtractor={(item) => item.sede.id.value.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cloud-search-outline" size={64} color="#3A3A3C" />
            <Text style={styles.emptyText}>No hay gimnasios disponibles.</Text>
            <Text style={styles.emptySubtext}>Prueba ajustando los filtros de amenidades y servicios.</Text>
          </View>
        }
      />

      {/* Filter FAB for Catalog */}
      <TouchableOpacity 
        style={styles.filterFab} 
        onPress={() => setFilterVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="tune-variant" size={24} color="#FFF" />
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <FilterBottomSheet 
        visible={filterVisible} 
        onClose={() => setFilterVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  magazineLabel: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF5E00',
  },
  closeButtonText: {
    color: '#FF5E00',
    fontWeight: '700',
    fontSize: 14,
  },
  activeFiltersScroll: {
    marginTop: 12,
    flexGrow: 0,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
  },
  filterFab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    backgroundColor: '#FF5E00',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 110,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#38BDF8',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF5E00',
  },
  filterBadgeText: {
    color: '#1C1C1E',
    fontSize: 11,
    fontWeight: '900',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    height: 250, // Much smaller to fit 2 vertically
    marginBottom: 16,
    borderRadius: 24,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    justifyContent: 'space-between',
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCountText: {
    color: '#A0A0A0',
    fontSize: 11,
    marginLeft: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  distanceText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  bottomContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  addressText: {
    fontSize: 11,
    color: '#B0B0B0',
    marginBottom: 8,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  chipText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  chipMore: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipMoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  aforoContainer: {
    marginTop: 4,
  },
  aforoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aforoText: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
  },
  aforoValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  aforoTrack: {
    height: 6,
    backgroundColor: '#3A3A3C',
    borderRadius: 3,
    overflow: 'hidden',
  },
  aforoFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  }
});

