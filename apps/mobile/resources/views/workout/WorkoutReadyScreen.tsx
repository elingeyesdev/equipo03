import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

const SCREEN_W = Dimensions.get('window').width;
const VIDEO_H  = Math.round((SCREEN_W - 32) * 9 / 16);


const buildYoutubeHtml = (videoId: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    iframe { width: 100%; height: 100vh; border: none; display: block; }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/${videoId}?playsinline=1&controls=1&rel=0&modestbranding=1&fs=1"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</body>
</html>
`;

type RouteParams = {
  exercise: { id: number; name: string };
  sport: string;
  trackingType: string;
  videoUrl?: never; // Obsolete
  youtubeVideoId?: string | null;
};

export const WorkoutReadyScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { exercise, sport, trackingType, youtubeVideoId } = route.params as RouteParams;

  const openInNativeYouTube = async (id: string) => {
    const appUrl = `youtube://watch?v=${id}`;
    const webUrl = `https://www.youtube.com/watch?v=${id}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo abrir YouTube.');
    }
  };

  const handleStart = () => {
    navigation.replace('WorkoutActive', { exercise, sport, trackingType });
  };

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

        {/* Video */}
        {youtubeVideoId ? (
          <View style={s.videoWrap}>
            <View style={[s.videoLabel, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="youtube" size={16} color="#FF5E00" />
                <Text style={s.videoLabelTxt}>Demo del ejercicio</Text>
              </View>
              <TouchableOpacity onPress={() => openInNativeYouTube(youtubeVideoId)}>
                <Text style={{ color: '#0A84FF', fontSize: 12, fontWeight: '600' }}>
                  Abrir en YouTube
                </Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: buildYoutubeHtml(youtubeVideoId), baseUrl: 'https://www.youtube.com' }}
              style={[s.videoPlayer, { height: VIDEO_H }]}
              allowsFullscreenVideo
              javaScriptEnabled
              scrollEnabled={false}
              originWhitelist={['*']}
            />
          </View>
        ) : (
          <View style={s.noVideo}>
            <MaterialCommunityIcons name="video-off-outline" size={32} color="#333" />
            <Text style={s.noVideoTxt}>Sin video disponible</Text>
          </View>
        )}

        {/* Exercise info */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="dumbbell" size={20} color="#FF5E00" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.infoName}>{exercise.name}</Text>
            <Text style={s.infoType}>{sport}</Text>
          </View>
        </View>

        {/* Start button */}
        <TouchableOpacity style={s.startBtn} activeOpacity={0.8} onPress={handleStart}>
          <MaterialCommunityIcons name="play-circle-outline" size={22} color="#fff" />
          <Text style={s.startBtnTxt}>Iniciar</Text>
        </TouchableOpacity>
      </ScrollView>
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
  videoWrap: { backgroundColor: '#1C1C1E', borderRadius: 14, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2C' },
  videoLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, paddingBottom: 8 },
  videoLabelTxt: { color: '#888', fontSize: 13 },
  videoPlayer: { width: '100%', backgroundColor: '#000' },
  noVideo: { backgroundColor: '#1C1C1E', borderRadius: 14, padding: 40, alignItems: 'center', gap: 8, marginBottom: 16 },
  noVideoTxt: { color: '#555', fontSize: 13 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2A2A2C' },
  infoName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoType: { color: '#888', fontSize: 13, marginTop: 2 },
  startBtn: { backgroundColor: '#FF5E00', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  startBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
