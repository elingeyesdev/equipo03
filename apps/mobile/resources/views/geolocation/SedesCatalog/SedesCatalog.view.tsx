import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, SafeAreaView, Platform, ScrollView } from 'react-native';
import { SedeConDistancia, Sede } from '@gymsync/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
        source={{ uri: item.sede.imagenUrl || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000' }} 
        style={styles.cardImage}
        imageStyle={{ borderRadius: 28 }}
      >
        <View style={styles.cardOverlay}>
          {/* Header Info */}
          <View style={styles.topRow}>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.sede.rating?.toFixed(1) || '4.5'}</Text>
              <Text style={styles.reviewCountText}>({item.sede.resenasCount || 100})</Text>
            </View>
            <View style={styles.distanceBadge}>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color="#00D9FF" />
              <Text style={styles.distanceText}>{item.distancia.kmCorta}</Text>
            </View>
          </View>
          
          <View style={styles.bottomContent}>
             <Text style={styles.title} numberOfLines={1}>{item.sede.nombre}</Text>
             <Text style={styles.addressText} numberOfLines={1}>
               <MaterialCommunityIcons name="map-marker" size={14} color="#888" /> {item.sede.direccion}
             </Text>
             
             {/* Servicios Chips Premium */}
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                <View style={styles.chipsContainer}>
                  {item.sede.servicios.slice(0, 4).map((servicio, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{servicio}</Text>
                    </View>
                  ))}
                  {item.sede.servicios.length > 4 && (
                    <View style={styles.chipMore}>
                      <Text style={styles.chipMoreText}>+{item.sede.servicios.length - 4}</Text>
                    </View>
                  )}
                </View>
             </ScrollView>

             {renderAforoBar(item.sede.aforo.actual, item.sede.aforo.maximo)}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.magazineLabel}>GYMSYNC PREMIUM</Text>
          <Text style={styles.headerTitle}>Explorar Sedes</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onCerrarCatalogo} activeOpacity={0.8}>
          <MaterialCommunityIcons name="map-outline" size={18} color="#FF5E00" style={{marginRight: 4}} />
          <Text style={styles.closeButtonText}>Ir al Mapa</Text>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  magazineLabel: {
    color: '#00D9FF',
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
    backgroundColor: 'rgba(255, 94, 0, 0.1)',
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
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    height: 380,
    marginBottom: 24,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 28,
    justifyContent: 'space-between',
    padding: 20,
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
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCountText: {
    color: '#A0A0A0',
    fontSize: 12,
    marginLeft: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  distanceText: {
    color: '#00D9FF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  bottomContent: {
    backgroundColor: 'rgba(20, 20, 22, 0.85)',
    borderRadius: 20,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  addressText: {
    fontSize: 13,
    color: '#B0B0B0',
    marginBottom: 14,
    fontWeight: '500',
  },
  chipsScroll: {
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.3)',
  },
  chipText: {
    color: '#00D9FF',
    fontSize: 11,
    fontWeight: '700',
  },
  chipMore: {
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
