import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Sede } from '@gymsync/core';
import { Distancia } from '@gymsync/core';
import { AforoBadge } from '../UI/AforoBadge/AforoBadge.component';
import { MachineCatalogList } from './MachineCatalogList';
import { styles } from './SedeInfoModal.styles';

// ─── Tipos internos ───────────────────────────────────────────────────────────
type DrillView    = 'MAIN' | 'MACHINES';
type MachineFilter = 'AVAILABLE' | 'MAINTENANCE';

const FILTER_LABEL: Record<MachineFilter, string> = {
  AVAILABLE:   'Máquinas Disponibles',
  MAINTENANCE: 'Máquinas en Mantenimiento',
};

type SedeInfoModalViewProps = {
  sede: Sede;
  distancia: Distancia;
  visible: boolean;
  onClose: () => void;
  onNavigate: () => void;
  onReserve?: () => void;
  isAdmin?: boolean;
};

// ─── Componente ───────────────────────────────────────────────────────────────
export const SedeInfoModalView: React.FC<SedeInfoModalViewProps> = ({
  sede,
  distancia,
  visible,
  onClose,
  onNavigate,
  onReserve,
  isAdmin = false,
}) => {
  const [currentView,   setCurrentView]   = useState<DrillView>('MAIN');
  const [machineFilter, setMachineFilter] = useState<MachineFilter | null>(null);

  const gymId = Number(sede.id.value);

  const openMachines = useCallback((filter: MachineFilter) => {
    setMachineFilter(filter);
    setCurrentView('MACHINES');
  }, []);

  const goBack = useCallback(() => {
    setCurrentView('MAIN');
    setMachineFilter(null);
  }, []);

  const handleClose = useCallback(() => {
    setCurrentView('MAIN');
    setMachineFilter(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.modalContainer, currentView === 'MACHINES' && { flex: 1 }]}>

          {/* Handle visual */}
          <View style={styles.handle} />

          {/* ─── Encabezado MACHINES (back + título) ─── */}
          {currentView === 'MACHINES' && (
            <View style={s.drillHeader}>
              <TouchableOpacity style={s.backBtn} onPress={goBack} hitSlop={8}>
                <MaterialCommunityIcons name="chevron-left" size={22} color="#E0E0E0" />
              </TouchableOpacity>
              <Text style={s.drillTitle} numberOfLines={1}>
                {machineFilter ? FILTER_LABEL[machineFilter] : 'Máquinas'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <MaterialCommunityIcons name="close" size={18} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Encabezado MAIN ─── */}
          {currentView === 'MAIN' && (
            <View style={styles.headerSection}>
              <View style={styles.headerLeft}>
                {!!sede.parentName && (
                  <Text style={styles.sedeBrand}>{sede.parentName}</Text>
                )}
                <Text style={styles.sedeName}>{sede.nombre}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color="#B0B0B0" />
                  <Text style={styles.sedeAddress}>{sede.direccion}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityLabel="Cerrar"
              >
                <MaterialCommunityIcons name="close" size={18} color="#B0B0B0" />
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════ VISTA: MACHINES ══════════════ */}
          {currentView === 'MACHINES' && machineFilter && (
            <View style={s.catalogContainer}>
              <MachineCatalogList gymId={gymId} status={machineFilter} />
            </View>
          )}

          {/* ══════════════ VISTA: MAIN ══════════════ */}
          {currentView === 'MAIN' && (
            <>
              {/* Métricas rápidas */}
              <View style={styles.quickInfo}>
                <View style={styles.quickInfoItem}>
                  <Text style={styles.quickInfoLabel}>Distancia</Text>
                  <Text style={styles.quickInfoValue}>{distancia.kmCorta}</Text>
                </View>
                <View style={styles.quickInfoDivider} />
                <View style={styles.quickInfoItem}>
                  <Text style={styles.quickInfoLabel}>Estado</Text>
                  <Text style={[
                    styles.statusText,
                    {
                      color: !sede.estaAbierta
                        ? '#888'
                        : sede.estaDisponible ? '#34C759' : '#FF3B30',
                    },
                  ]}>
                    {!sede.estaAbierta ? 'Cerrado' : sede.estaDisponible ? 'Abierto' : 'Lleno'}
                  </Text>
                </View>
                <View style={styles.quickInfoDivider} />
                <View style={styles.quickInfoItem}>
                  <Text style={styles.quickInfoLabel}>Aforo</Text>
                  <AforoBadge aforo={sede.aforo} size="medium" />
                </View>
              </View>

              {/* Barra de ocupación */}
              {sede.aforo && sede.aforo.maximo > 0 && (
                <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#888', fontSize: 12 }}>Ocupación actual</Text>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                      {sede.aforo.actual} / {sede.aforo.maximo}
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#1C1C1E', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{
                      height: 6,
                      borderRadius: 3,
                      width: `${Math.min(100, Math.round((sede.aforo.actual / sede.aforo.maximo) * 100))}%`,
                      backgroundColor:
                        (sede.aforo.actual / sede.aforo.maximo) >= 0.85 ? '#FF3B30' :
                        (sede.aforo.actual / sede.aforo.maximo) >= 0.60 ? '#FF9500' : '#34C759',
                    }} />
                  </View>
                </View>
              )}

              {/* ── Máquinas: 2 tarjetas presionables ── */}
              {sede.machineStats && sede.machineStats.total > 0 && (
                <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <MaterialCommunityIcons name="dumbbell" size={13} color="#B0B0B0" />
                    <Text style={{ color: '#888', fontSize: 12 }}>Inventario de máquinas</Text>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 'auto' }}>
                      {sede.machineStats.available}/{sede.machineStats.total}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[s.machineCard, s.machineCardAvailable]}
                      activeOpacity={0.7}
                      onPress={() => openMachines('AVAILABLE')}
                    >
                      <Text style={[s.machineCount, { color: '#00E5A3' }]}>
                        {sede.machineStats.available}
                      </Text>
                      <Text style={s.machineLabel}>Disponible</Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={11}
                        color="#00E5A330"
                        style={s.cardChevron}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.machineCard, s.machineCardMaintenance]}
                      activeOpacity={0.7}
                      onPress={() => openMachines('MAINTENANCE')}
                    >
                      <Text style={[s.machineCount, { color: '#FF3B30' }]}>
                        {sede.machineStats.maintenance}
                      </Text>
                      <Text style={s.machineLabel}>Mantenimiento</Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={11}
                        color="#FF3B3030"
                        style={s.cardChevron}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Contenido scrollable */}
              <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Horarios */}
                <View style={styles.section}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="clock-outline" size={15} color="#B0B0B0" />
                    <Text style={styles.sectionTitle}>
                      Horarios ({sede.estaAbierta ? 'Abierto Ahora' : 'Cerrado'})
                    </Text>
                  </View>
                  {sede.horarios && Object.keys(sede.horarios.raw).length > 0 ? (
                    Object.entries(sede.horarios.raw).map(([dia, horario]) => (
                      <View key={dia} style={styles.horarioRow}>
                        <Text style={styles.horarioDia}>
                          {dia.charAt(0).toUpperCase() + dia.slice(1)}
                        </Text>
                        <Text style={styles.horarioHora}>
                          {horario?.cerrado ? 'Cerrado' : `${horario?.apertura} - ${horario?.cierre}`}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#8E8E93', fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>
                      No hay horarios disponibles aún.
                    </Text>
                  )}
                </View>

                {/* Servicios */}
                {sede.servicios.length > 0 && (
                  <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="dumbbell" size={15} color="#B0B0B0" />
                      <Text style={styles.sectionTitle}>Servicios</Text>
                    </View>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="star-outline" size={15} color="#B0B0B0" />
                      <Text style={styles.sectionTitle}>Beneficios</Text>
                    </View>
                    <View style={styles.serviciosGrid}>
                      {sede.beneficios.map((beneficio) => (
                        <View key={beneficio} style={[styles.servicioTag, { backgroundColor: '#1C1C1E' }]}>
                          <Text style={[styles.servicioText, { color: '#f1c40f' }]}>{beneficio}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Teléfono */}
                {sede.telefono && (
                  <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="phone-outline" size={15} color="#B0B0B0" />
                      <Text style={styles.sectionTitle}>Contacto</Text>
                    </View>
                    <Text style={styles.telefonoText}>{sede.telefono}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Barra de acciones */}
              <View style={[styles.actionBar, { flexDirection: 'row', gap: 12 }]}>
                <TouchableOpacity
                  style={[styles.navigateButton, { flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#38BDF8' }]}
                  onPress={onNavigate}
                  activeOpacity={0.8}
                  accessibilityLabel={`Navegar a ${sede.nombre}`}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="navigation-variant-outline" size={16} color="#38BDF8" />
                    <Text style={[styles.navigateButtonText, { color: '#38BDF8' }]}>Cómo llegar</Text>
                  </View>
                </TouchableOpacity>

                {isAdmin ? (
                  <View style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderWidth: 1, borderColor: '#333' }}>
                    <Text style={{ color: '#555', fontSize: 13, fontWeight: '600' }}>Acceso Administrativo</Text>
                  </View>
                ) : onReserve ? (
                  <TouchableOpacity
                    style={[styles.navigateButton, { flex: 1, backgroundColor: '#FF5E00' }]}
                    onPress={onReserve}
                    activeOpacity={0.8}
                    accessibilityLabel={`Reservar en ${sede.nombre}`}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="calendar-check-outline" size={16} color="#FFF" />
                      <Text style={[styles.navigateButtonText, { color: '#FFF' }]}>Reservar</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
};

// ─── Estilos locales (complementan SedeInfoModal.styles.ts) ──────────────────
const s = StyleSheet.create({
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1C1C1E',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  drillTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  catalogContainer: {
    flex: 1,
    minHeight: 200,
  },
  machineCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  machineCardAvailable: {
    backgroundColor: '#00E5A310',
    borderColor: '#00E5A325',
  },
  machineCardMaintenance: {
    backgroundColor: '#FF3B3010',
    borderColor: '#FF3B3025',
  },
  machineCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  machineLabel: {
    color: '#555',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  cardChevron: {
    position: 'absolute',
    right: 6,
    alignSelf: 'center',
  },
});
