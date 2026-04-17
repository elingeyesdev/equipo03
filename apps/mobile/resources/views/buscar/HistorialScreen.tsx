import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GIMNASIOS_HISTORIAL = [
  {
    id: '1',
    nombre: 'AES GYM',
    direccion: 'Calle Beni, Santa Cruz de la Sierra',
    rating: 4.8,
    ultimaVisita: '2026-04-01',
    icon: 'dumbbell',
    color: '#1a1a2e',
  },
  {
    id: '2',
    nombre: 'ZEUS GYM',
    direccion: 'Calle Laureles, Santa Cruz de la Sierra',
    rating: 4.8,
    ultimaVisita: '2026-03-28',
    icon: 'weight-lifter',
    color: '#162447',
  },
  {
    id: '3',
    nombre: 'SmartFit',
    direccion: 'Avenida Al de la Sierra',
    rating: 4.5,
    ultimaVisita: '2026-03-20',
    icon: 'lightning-bolt',
    color: '#1b1b2f',
  },
  {
    id: '4',
    nombre: 'CrossFit Box',
    direccion: 'Av. Bush, 3er Anillo',
    rating: 4.7,
    ultimaVisita: '2026-03-15',
    icon: 'arm-flex',
    color: '#0f3460',
  },
  {
    id: '5',
    nombre: 'Iron Paradise',
    direccion: 'Av. San Martín, 2do Anillo',
    rating: 4.6,
    ultimaVisita: '2026-03-10',
    icon: 'trophy',
    color: '#533483',
  },
  {
    id: '6',
    nombre: 'FitZone',
    direccion: 'Calle Junín esq. Sucre',
    rating: 4.4,
    ultimaVisita: '2026-02-28',
    icon: 'run-fast',
    color: '#0f3460',
  },
];

export const HistorialScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <FlatList
        data={GIMNASIOS_HISTORIAL}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.cardIcon, { backgroundColor: item.color }]}>
              <MaterialCommunityIcons name={item.icon as any} size={28} color="#fff" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.nombre}</Text>
              <Text style={styles.cardAddress} numberOfLines={1}>
                {item.direccion}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={14} color="#f05b22" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
                <Text style={styles.visitDate}>
                  Última visita: {new Date(item.ultimaVisita).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#555" />
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.headerInfo}>
            <MaterialCommunityIcons name="history" size={32} color="#f05b22" />
            <Text style={styles.headerText}>
              Estos son los gimnasios que has visitado recientemente.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  headerText: {
    flex: 1,
    color: '#aaa',
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardAddress: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  visitDate: {
    color: '#666',
    fontSize: 11,
  },
});
