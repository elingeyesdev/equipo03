import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { SedeConDistancia } from '@gymsync/core';
import { AforoBadge } from '../UI/AforoBadge/AforoBadge.component';
import { Sede } from '@gymsync/core';

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

  const renderItem = ({ item }: { item: SedeConDistancia }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => onSelectSede(item.sede)}
    >
      {/* Indicador superior */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{item.sede.nombre}</Text>
          <Text style={styles.distanceText}>
            A {item.distancia.kmCorta} de ti
          </Text>
        </View>
        <AforoBadge aforo={item.sede.aforo} />
      </View>

      <Text style={styles.addressText} numberOfLines={1}>
        📍 {item.sede.direccion}
      </Text>

      {/* Servicios Chips */}
      {item.sede.servicios.length > 0 && (
        <View style={styles.chipsContainer}>
          {item.sede.servicios.slice(0, 3).map((servicio, index) => (
            <View key={index} style={styles.chip}>
              <Text style={styles.chipText}>{servicio}</Text>
            </View>
          ))}
          {item.sede.servicios.length > 3 && (
            <Text style={styles.moreText}>+{item.sede.servicios.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Catálogo de Sedes</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onCerrarCatalogo}>
          <Text style={styles.closeButtonText}>✕ Mapa</Text>
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
            <Text style={styles.emptyText}>No hay sedes cercanas con estos filtros.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Fondo profundo
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 94, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FF5E00',
  },
  closeButtonText: {
    color: '#FF5E00',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  moreText: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  }
});
