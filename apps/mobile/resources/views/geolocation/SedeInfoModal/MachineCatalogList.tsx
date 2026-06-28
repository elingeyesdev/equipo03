import React, { useEffect, useState, useMemo } from 'react';
import {View, Text, SectionList, Image, StyleSheet, Modal, TouchableOpacity, Dimensions} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { machinesApi, MachineItem } from '../../../../app/Providers/machines/machines.api';
import { DumbbellSpinner } from '../../../../app/Shared/components/ui/DumbbellSpinner';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  gymId: number;
  status: 'AVAILABLE' | 'MAINTENANCE';
}

export const MachineCatalogList: React.FC<Props> = ({ gymId, status }) => {
  const [machines,         setMachines]         = useState<MachineItem[]>([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [selectedMachine,  setSelectedMachine]  = useState<MachineItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMachines = async () => {
      try {
        setIsLoading(true);
        const rawData = await machinesApi.getByGymAndStatus(gymId, status);
        const safeMachines: MachineItem[] = Array.isArray(rawData)
          ? rawData
          : (rawData?.data ?? []);
        if (isMounted) setMachines(safeMachines);
      } catch (error) {
        console.error('[MachineCatalogList] Error fetching machines:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchMachines();
    return () => { isMounted = false; };
  }, [gymId, status]);

  const sections = useMemo(() => {
    if (!machines.length) return [];
    const grouped = machines.reduce((acc, machine) => {
      const cat = machine.category || 'OTROS';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(machine);
      return acc;
    }, {} as Record<string, MachineItem[]>);

    return Object.keys(grouped).map((title) => ({
      title,
      data: grouped[title],
    }));
  }, [machines]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <DumbbellSpinner size="large" color="#FF6B00" />
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No hay máquinas en este estado.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, width: '100%' }}>
      {/* ── Image viewer Modal ─────────────────────────────────────────── */}
      <Modal
        visible={!!selectedMachine}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedMachine(null)}
      >
        <View style={styles.overlay}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelectedMachine(null)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Image or fallback */}
          {selectedMachine?.imageUrl ? (
            <Image
              source={{ uri: selectedMachine.imageUrl }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImageBox}>
              <MaterialCommunityIcons name="image-off-outline" size={52} color="#4B5563" />
              <Text style={styles.noImageTxt}>Imagen no disponible</Text>
            </View>
          )}

          {/* Machine info */}
          <View style={styles.imageFooter}>
            <Text style={styles.imageFooterName} numberOfLines={1}>
              {selectedMachine?.name}
            </Text>
            {selectedMachine?.category ? (
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeTxt}>{selectedMachine.category}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              {title.toUpperCase()} ({data.length})
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setSelectedMachine(item)}
          >
            <View style={styles.avatarContainer}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{item.name.charAt(0)}</Text>
                </View>
              )}
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.machineName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.category}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#374151" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 40,
  },
  sectionHeader: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  sectionHeaderText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F2937',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#D1D5DB',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  machineName: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  badgeText: {
    color: '#FF6B00',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // ── Image viewer Modal ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.65,
  },
  noImageBox: {
    width: SCREEN_W * 0.7,
    height: SCREEN_H * 0.35,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  noImageTxt: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  imageFooter: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 8,
  },
  imageFooterName: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  imageBadge: {
    backgroundColor: 'rgba(255,107,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.3)',
  },
  imageBadgeTxt: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
