import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ExerciseDetailModal } from '../../components/ExerciseDetailModal';

type RouteParams = {
  exercise: { id: number; name: string; equipmentRequired?: string; muscleGroup?: string; description?: string; };
  sport: string;
  trackingType: string;
  youtubeVideoId?: string | null;
  imageUrl?: string | null;
};

const getExerciseCover = (imageUrl?: string | null, equipment: string = '') => {
  if (imageUrl) return imageUrl;
  const eq = equipment.toLowerCase();
  if (eq.includes('mancuerna')) return 'https://images.pexels.com/photos/3289711/pexels-photo-3289711.jpeg?auto=compress&cs=tinysrgb&w=600';
  if (eq.includes('barra')) return 'https://images.pexels.com/photos/949126/pexels-photo-949126.jpeg?auto=compress&cs=tinysrgb&w=600';
  if (eq.includes('polea') || eq.includes('máquina') || eq.includes('prensa')) return 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=600';
  if (eq.includes('cinta') || eq.includes('bicicleta') || eq.includes('cardio')) return 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=600';
  if (eq.includes('kettlebell') || eq.includes('pesa rusa')) return 'https://images.pexels.com/photos/221247/pexels-photo-221247.jpeg?auto=compress&cs=tinysrgb&w=600';
  return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=600';
};

export const WorkoutReadyScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { exercise, sport, trackingType, youtubeVideoId, imageUrl: exerciseImageUrl } = route.params as RouteParams;
  const [showDetail, setShowDetail] = useState(false);

  const coverUri = getExerciseCover(exerciseImageUrl, exercise?.equipmentRequired);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} bounces={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{exercise.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={s.readyTitle}>¿Listo para entrenar?</Text>

        {/* Hero cover */}
        <View style={s.heroWrap}>
          <Image source={{ uri: coverUri }} style={s.heroImage} />
          <View style={s.heroOverlay}>
            <Text style={s.heroName}>{exercise.name}</Text>
            <Text style={s.heroSport}>{sport}</Text>
          </View>
        </View>

        {/* Detalle técnico */}
        <TouchableOpacity style={s.detailBtn} activeOpacity={0.75} onPress={() => setShowDetail(true)}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#FF5E00" />
          <Text style={s.detailBtnText}>Ver detalle técnico</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#555" />
        </TouchableOpacity>

        {/* Exercise info */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="dumbbell" size={20} color="#FF5E00" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.infoName}>{exercise.name}</Text>
            <Text style={s.infoType}>{exercise.equipmentRequired || 'Peso corporal'}</Text>
          </View>
        </View>

        {/* Start button */}
        <TouchableOpacity style={s.startBtn} activeOpacity={0.8} onPress={() => navigation.replace('WorkoutActive', { exercise, sport, trackingType })}>
          <MaterialCommunityIcons name="play-circle-outline" size={22} color="#fff" />
          <Text style={s.startBtnTxt}>Iniciar</Text>
        </TouchableOpacity>
      </ScrollView>

      <ExerciseDetailModal
        visible={showDetail}
        exercise={{
          name: exercise.name,
          description: exercise.description,
          muscleGroup: exercise.muscleGroup,
          equipmentRequired: exercise.equipmentRequired,
          imageUrl: exerciseImageUrl,
          youtubeVideoId: youtubeVideoId,
        }}
        onClose={() => setShowDetail(false)}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },
  readyTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16 },
  heroWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 12, height: 280, backgroundColor: '#111' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'rgba(0,0,0,0.55)' },
  heroName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  heroSport: { color: '#a0a0a0', fontSize: 12, fontWeight: '600', marginTop: 2 },
  detailBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2C', gap: 8 },
  detailBtnText: { flex: 1, color: '#ccc', fontSize: 14, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2A2A2C' },
  infoName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoType: { color: '#888', fontSize: 13, marginTop: 2 },
  startBtn: { backgroundColor: '#FF5E00', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
