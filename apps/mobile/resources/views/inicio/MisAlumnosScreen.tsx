import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { staffApi, ActiveAdvisee } from '../../../app/Providers/staff/api/staff.api';

export const MisAlumnosScreen = () => {
  const navigation  = useNavigation<any>();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const { data: advisees = [], isLoading, refetch } = useQuery({
    queryKey: ['trainer-active-advisees'],
    queryFn:  staffApi.getActiveAdvisees,
    staleTime: 60_000,
    retry: 1,
  });

  const handleCancelAdvisee = (item: ActiveAdvisee) => {
    Alert.alert(
      'Cancelar asesoría',
      `¿Deseas cancelar la asesoría con ${item.clientName}? Se reiniciarán su plan nutricional y rutinas asignadas.`,
      [
        { text: 'No cancelar', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(item.id);
            try {
              await staffApi.cancelAdvisorship(item.id);
              await refetch();
              queryClient.invalidateQueries({ queryKey: ['trainer-active-advisees'] });
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'No se pudo cancelar la asesoría.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mis Alumnos Activos</Text>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{advisees.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      ) : advisees.length === 0 ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="account-group-outline" size={56} color="#222" />
          <Text style={s.emptyTitle}>Sin alumnos activos</Text>
          <Text style={s.emptyTxt}>Aún no tienes alumnos asignados.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#38BDF8"
              colors={['#38BDF8']}
            />
          }
        >
          {(advisees as ActiveAdvisee[]).map((item) => {
            const isCancelling = processingId === item.id;
            return (
              <View key={item.clientId} style={s.card}>
                <View style={s.cardLeft}>
                  <View style={s.avatar}>
                    <MaterialCommunityIcons name="account-outline" size={24} color="#FF5E00" />
                  </View>
                  <View style={s.info}>
                    <Text style={s.name}>{item.clientName}</Text>
                    <Text style={s.sub} numberOfLines={1}>
                      {item.phone ?? 'Sin teléfono registrado'}
                    </Text>
                  </View>
                </View>

                {isCancelling ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <View style={s.actions}>
                    <TouchableOpacity
                      style={s.profileBtn}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('PerfilAlumno', {
                        clientId:   item.clientId,
                        clientName: item.clientName,
                      })}
                    >
                      <MaterialCommunityIcons name="account-eye-outline" size={14} color="#fff" />
                      <Text style={s.profileBtnTxt}>Ver Perfil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.cancelBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCancelAdvisee(item)}
                    >
                      <MaterialCommunityIcons name="cancel" size={14} color="#EF4444" />
                      <Text style={s.cancelBtnTxt}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#161618', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#222',
  },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '800' },
  badge: {
    backgroundColor: '#0d2a3d', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: '#38BDF844',
  },
  badgeTxt: { color: '#38BDF8', fontSize: 14, fontWeight: '800' },

  emptyTitle: { color: '#444', fontSize: 16, fontWeight: '700', marginTop: 16 },
  emptyTxt:   { color: '#333', fontSize: 14, marginTop: 6 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0e0e0e', borderRadius: 16,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#1a1a1a', gap: 12,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FF5E00',
  },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sub:  { color: '#555', fontSize: 13, marginTop: 3 },

  actions:       { flexDirection: 'column', gap: 7, alignItems: 'flex-end' },
  profileBtn:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FF5E00', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
  },
  profileBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cancelBtn:     {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1C1C1E', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#EF444466',
  },
  cancelBtnTxt: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
});
