import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AlertaBanner } from '../alertas/AlertaBanner';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

// ── Mock data ──
const GIMNASIOS = [
  {
    id: '1',
    nombre: 'AES GYM',
    direccion: 'Calle Beni, Santa Cruz de la Sierra',
    rating: 4.8,
    color: '#1a1a2e',
    icon: 'dumbbell' as const,
  },
  {
    id: '2',
    nombre: 'ZEUS GYM',
    direccion: 'Calle Laureles, Santa Cruz de la Sierra',
    rating: 4.8,
    color: '#162447',
    icon: 'weight-lifter' as const,
  },
  {
    id: '3',
    nombre: 'SmartFit',
    direccion: 'Avenida Al de la Sierra',
    rating: 4.5,
    color: '#1b1b2f',
    icon: 'lightning-bolt' as const,
  },
  {
    id: '4',
    nombre: 'CrossFit Box',
    direccion: 'Av. Bush, 3er Anillo',
    rating: 4.7,
    color: '#0f3460',
    icon: 'arm-flex' as const,
  },
];

const GALLERY_ICONS: Array<{ icon: string; color: string }> = [
  { icon: 'run', color: '#e94560' },
  { icon: 'bike', color: '#f05b22' },
  { icon: 'yoga', color: '#00b4d8' },
  { icon: 'rowing', color: '#06d6a0' },
  { icon: 'weight-lifter', color: '#9b5de5' },
  { icon: 'swim', color: '#0077b6' },
  { icon: 'basketball', color: '#ef476f' },
  { icon: 'kabaddi', color: '#ffd166' },
  { icon: 'gymnastics', color: '#06d6a0' },
];

export const InicioScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Inicio</Text>
          <TouchableOpacity style={styles.searchBtn}>
            <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Alerta de salud (banner automático) ── */}
        <AlertaBanner />

        {/* ── Gimnasios cerca de ti ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconRow}>
            <MaterialCommunityIcons name="dumbbell" size={28} color="#f05b22" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.sectionTitle}>Gimnasios cerca de ti</Text>
              <Text style={styles.sectionSubtitle}>Explora clases cercanas</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={GIMNASIOS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.carouselContainer}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gymCard} activeOpacity={0.8}>
              <View style={[styles.gymCardImage, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon as any} size={48} color="#fff" />
              </View>
              <Text style={styles.gymName}>{item.nombre}</Text>
              <Text style={styles.gymAddress} numberOfLines={2}>
                {item.direccion}
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>{item.rating}</Text>
                <MaterialCommunityIcons name="star" size={14} color="#f05b22" />
              </View>
            </TouchableOpacity>
          )}
        />

        {/* ── Tus primeros pasos con GymSync ── */}
        <View style={styles.onboardSection}>
          <View style={styles.sectionIconRow}>
            <MaterialCommunityIcons name="shoe-sneaker" size={26} color="#f05b22" />
            <Text style={[styles.sectionTitle, { marginLeft: 10 }]}>
              Tus primeros pasos con{'\n'}GymSync
            </Text>
          </View>

          {/* Gallery grid */}
          <View style={styles.galleryGrid}>
            {GALLERY_ICONS.map((item, index) => (
              <View key={index} style={styles.galleryItem}>
                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              </View>
            ))}
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Agenda clases en cualquiera de las sedes afiliadas con GymSync, observa tu progreso y
              no pierdas de vista tu bienestar.
            </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Buscar clases</Text>
            </TouchableOpacity>
          </View>
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
  header: {
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
  searchBtn: {
    backgroundColor: '#1c1c1e',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 2,
  },
  carouselContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  gymCard: {
    width: CARD_WIDTH,
    marginRight: 0,
  },
  gymCardImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gymName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gymAddress: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
    lineHeight: 15,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  onboardSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 6,
  },
  galleryItem: {
    width: (width - 40 - 12) / 3,
    aspectRatio: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
  },
  linkText: {
    color: '#f05b22',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 8,
  },
});
