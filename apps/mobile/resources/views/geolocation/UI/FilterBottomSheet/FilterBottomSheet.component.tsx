import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import { useFilterStore } from '../../../../../app/Providers/geolocation/stores/FilterStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './FilterBottomSheet.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SERVICIOS = [
  { id: 'Musculación', icon: 'weight-lifter' },
  { id: 'Crossfit', icon: 'kettlebell' },
  { id: 'Yoga', icon: 'yoga' },
  { id: 'Cardio', icon: 'run' },
  { id: 'Piscina', icon: 'pool' },
  { id: 'Boxeo', icon: 'boxing-glove' },
  { id: 'HIIT', icon: 'fire' },
  { id: 'Calistenia', icon: 'human-handsup' }
];

const AMENIDADES = [
  { id: 'Duchas', icon: 'shower' },
  { id: 'WiFi', icon: 'wifi' },
  { id: 'AC', icon: 'air-conditioner' },
  { id: 'Estacionamiento', icon: 'parking' },
  { id: 'Sauna', icon: 'hot-tub' },
  { id: 'Nutricionista', icon: 'food-apple' }
];

export const FilterBottomSheet: React.FC<Props> = ({ visible, onClose }) => {
  const { filtros, toggleServicio, toggleBeneficio, resetFiltros } = useFilterStore();

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Filtros Avanzados</Text>
            <TouchableOpacity onPress={resetFiltros} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <Text style={styles.clearText}>Restablecer</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Sección de Servicios */}
            <Text style={styles.sectionTitle}>Especialidades de Entrenamiento</Text>
            <View style={styles.chipsContainer}>
              {SERVICIOS.map(item => {
                const isActive = filtros.servicios?.includes(item.id as any) ?? false;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => toggleServicio(item.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons 
                       name={item.icon as any} 
                       size={18} 
                       color={isActive ? '#FF5E00' : '#888'} 
                       style={{marginRight: 6}} 
                    />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 28 }} />

            {/* Sección de Amenidades */}
            <Text style={styles.sectionTitle}>Amenidades Exclusivas</Text>
            <View style={styles.chipsContainer}>
              {AMENIDADES.map(item => {
                const isActive = filtros.beneficios?.includes(item.id as any) ?? false;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => toggleBeneficio(item.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons 
                       name={item.icon as any} 
                       size={18} 
                       color={isActive ? '#FF5E00' : '#888'} 
                       style={{marginRight: 6}} 
                    />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
          
          <TouchableOpacity style={styles.applyButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.applyButtonText}>Mostrar Resultados</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
