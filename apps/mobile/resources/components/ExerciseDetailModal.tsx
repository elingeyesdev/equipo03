import React, { useState } from 'react';
import {
  Modal, View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Linking, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import YoutubeIframe from 'react-native-youtube-iframe';

type ExerciseInfo = {
  name: string;
  description?: string | null;
  muscleGroup?: string;
  category?: string;
  equipmentRequired?: string | null;
  imageUrl?: string | null;
  youtubeVideoId?: string | null;
};

type Props = {
  visible: boolean;
  exercise: ExerciseInfo;
  onClose: () => void;
};

const { width: SCREEN_W } = Dimensions.get('window');

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

export const ExerciseDetailModal: React.FC<Props> = ({ visible, exercise, onClose }) => {
  const [showVideo, setShowVideo] = useState(false);
  const coverUri = getExerciseCover(exercise.imageUrl, exercise.equipmentRequired ?? undefined);
  const hasVideo = !!exercise.youtubeVideoId;

  const fallbackDescription = `Este ejercicio se enfoca en fortalecer ${exercise.muscleGroup ?? 'el grupo muscular objetivo'} mediante el uso de ${exercise.equipmentRequired || 'peso corporal'}. Mantén una postura correcta y sigue las instrucciones de tu entrenador.`;

  const openYouTubeApp = async () => {
    if (!exercise.youtubeVideoId) return;
    const appUrl = `youtube://watch?v=${exercise.youtubeVideoId}`;
    const webUrl = `https://www.youtube.com/watch?v=${exercise.youtubeVideoId}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      Alert.alert('Error', 'No se pudo abrir YouTube.');
    }
  };

  const handleClose = () => {
    setShowVideo(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle} numberOfLines={2}>{exercise.name}</Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <MaterialCommunityIcons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            {/* Multimedia */}
            <View style={s.mediaWrap}>
              {showVideo && exercise.youtubeVideoId ? (
                <YoutubeIframe
                  videoId={exercise.youtubeVideoId}
                  height={Math.round((SCREEN_W - 48) * 9 / 16)}
                  play
                />
              ) : (
                <TouchableOpacity
                  activeOpacity={hasVideo ? 0.85 : 1}
                  onPress={() => hasVideo && setShowVideo(true)}
                  style={s.coverWrap}
                >
                  <Image source={{ uri: coverUri }} style={s.coverImage} />
                  {hasVideo && (
                    <View style={s.playOverlay}>
                      <View style={s.playCircle}>
                        <MaterialCommunityIcons name="play" size={36} color="#FFF" style={{ marginLeft: 3 }} />
                      </View>
                      <Text style={s.playText}>Ver demostración</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Tags */}
            <View style={s.tagsRow}>
              {exercise.muscleGroup && (
                <View style={[s.tag, { backgroundColor: '#FF5E0018' }]}>
                  <MaterialCommunityIcons name="arm-flex" size={13} color="#FF5E00" />
                  <Text style={[s.tagText, { color: '#FF5E00' }]}>{exercise.muscleGroup}</Text>
                </View>
              )}
              {exercise.category && (
                <View style={[s.tag, { backgroundColor: '#38BDF818' }]}>
                  <MaterialCommunityIcons name="tag-outline" size={13} color="#38BDF8" />
                  <Text style={[s.tagText, { color: '#38BDF8' }]}>{exercise.category}</Text>
                </View>
              )}
            </View>

            {/* Equipamiento */}
            {exercise.equipmentRequired ? (
              <View style={s.infoRow}>
                <MaterialCommunityIcons name="dumbbell" size={16} color="#666" />
                <Text style={s.infoLabel}>Equipamiento:</Text>
                <Text style={s.infoValue}>{exercise.equipmentRequired}</Text>
              </View>
            ) : null}

            {/* Descripción */}
            <View style={s.descSection}>
              <Text style={s.descTitle}>Descripción</Text>
              <Text style={s.descText}>
                {exercise.description || fallbackDescription}
              </Text>
            </View>

            {/* Botón YouTube externo */}
            {hasVideo && (
              <TouchableOpacity style={s.ytBtn} onPress={openYouTubeApp} activeOpacity={0.8}>
                <MaterialCommunityIcons name="youtube" size={20} color="#FF0000" />
                <Text style={s.ytBtnText}>Abrir en YouTube</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '800', marginRight: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#242424', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  mediaWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 16, backgroundColor: '#0d0d0d' },
  coverWrap: { width: '100%', aspectRatio: 16 / 9 },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  playCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,94,0,0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  playText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  infoLabel: { color: '#666', fontSize: 13 },
  infoValue: { color: '#a0a0a0', fontSize: 13, flex: 1 },
  descSection: { marginBottom: 20 },
  descTitle: { color: '#888', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  descText: { color: '#a0a0a0', fontSize: 14, lineHeight: 22 },
  ytBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#242424', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#333' },
  ytBtnText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
});
