/**
 * SedeInfoModal View — Modal con información detallada de una sede.
 * 
 * Implementado como bottom sheet con animación slide-up.
 * Muestra: nombre, dirección, aforo, horarios, servicios y acciones.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Sede } from '@gymsync/core';
import { Distancia } from '@gymsync/core';
import { AforoBadge } from '../UI/AforoBadge/AforoBadge.component';
import { styles } from './SedeInfoModal.styles';

type SedeInfoModalViewProps = {
  sede: Sede;
  distancia: Distancia;
  visible: boolean;
  onClose: () => void;
  onNavigate: () => void;
};

export const SedeInfoModalView: React.FC<SedeInfoModalViewProps> = ({
  sede,
  distancia,
  visible,
  onClose,
  onNavigate,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          {/* Handle de arrastre visual */}
          <View style={styles.handle} />

          {/* Encabezado */}
          <View style={styles.headerSection}>
            <View style={styles.headerLeft}>
              <Text style={styles.sedeName}>{sede.nombre}</Text>
              <Text style={styles.sedeAddress}>📍 {sede.direccion}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Cerrar"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Info rápida */}
          <View style={styles.quickInfo}>
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Distancia</Text>
              <Text style={styles.quickInfoValue}>{distancia.kmCorta}</Text>
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Aforo</Text>
              <AforoBadge aforo={sede.aforo} size="medium" />
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoLabel}>Estado</Text>
              <Text style={[
                styles.statusText,
                { color: sede.estaDisponible ? '#2ecc71' : '#e74c3c' }
              ]}>
                {sede.estaDisponible ? 'Disponible' : 'Lleno'}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Horarios */}
            {sede.horarios && Object.keys(sede.horarios.raw).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🕐 Horarios ({sede.estaAbierta ? 'Abierto Ahora' : 'Cerrado'})</Text>
                {Object.entries(sede.horarios.raw).map(([dia, horario]) => (
                  <View key={dia} style={styles.horarioRow}>
                    <Text style={styles.horarioDia}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Text>
                    <Text style={styles.horarioHora}>
                      {horario?.cerrado ? 'Cerrado' : `${horario?.apertura} - ${horario?.cierre}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Servicios */}
            {sede.servicios.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💪 Servicios</Text>
                <View style={styles.serviciosGrid}>
                  {sede.servicios.map((servicio) => (
                    <View key={servicio} style={styles.servicioTag}>
                      <Text style={styles.servicioText}>{servicio}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Beneficios */}
            {sede.beneficios && sede.beneficios.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⭐ Beneficios</Text>
                <View style={styles.serviciosGrid}>
                  {sede.beneficios.map((beneficio) => (
                    <View key={beneficio} style={[styles.servicioTag, { backgroundColor: 'rgba(241, 196, 15, 0.2)' }]}>
                      <Text style={[styles.servicioText, { color: '#f1c40f' }]}>{beneficio}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Teléfono */}
            {sede.telefono && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Contacto</Text>
                <Text style={styles.telefonoText}>{sede.telefono}</Text>
              </View>
            )}
          </ScrollView>

          {/* Botón de acción */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={onNavigate}
              activeOpacity={0.8}
              accessibilityLabel={`Navegar a ${sede.nombre}`}
            >
              <Text style={styles.navigateButtonText}>🧭 Cómo llegar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
