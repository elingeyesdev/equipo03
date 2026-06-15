import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { staffApi, ActiveAdvisee } from '../../../app/Providers/staff/api/staff.api';

const ClientCard = ({ item, onPress }: { item: ActiveAdvisee; onPress: () => void }) => (
  <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
    <View style={s.avatar}>
      <Text style={s.avatarTxt}>
        {(item.clientName ?? '?').charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.clientName}>{item.clientName}</Text>
      {item.phone ? (
        <Text style={s.clientPhone}>{item.phone}</Text>
      ) : (
        <Text style={s.clientPhoneEmpty}>Sin teléfono</Text>
      )}
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
  </TouchableOpacity>
);

export const SeguimientoScreen = () => {
  const navigation = useNavigation<any>();

  const { data: clients = [], isLoading, isError, refetch } = useQuery<ActiveAdvisee[]>({
    queryKey: ['active-advisees'],
    queryFn:  () => staffApi.getActiveAdvisees(),
    staleTime: 2 * 60_000,
    retry: 1,
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topBar}>
        <Text style={s.topTitle}>Seguimiento</Text>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#f05b22" />
        </View>
      ) : isError ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#333" />
          <Text style={s.errTxt}>No se pudo cargar tus clientes.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : clients.length === 0 ? (
        <View style={s.center}>
          <MaterialCommunityIcons name="account-group-outline" size={52} color="#1a1a1a" />
          <Text style={s.emptyTitle}>Sin clientes activos</Text>
          <Text style={s.emptySubTxt}>
            Aquí verás a los clientes que tengan una relación de asesoría activa contigo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ClientCard
              item={item}
              onPress={() =>
                navigation.navigate('HistorialRutina', {
                  clientId:   item.clientId,
                  clientName: item.clientName,
                  phone:      item.phone,
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#000' },
  list:  { padding: 16, paddingBottom: 100 },
  center:{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

  topBar:   { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#111' },
  topTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#0e0e0e', borderRadius: 14,
    borderWidth: 1, borderColor: '#1a1a1a',
    padding: 16, marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center',
  },
  avatarTxt:       { color: '#f05b22', fontSize: 18, fontWeight: '800' },
  clientName:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  clientPhone:     { color: '#555', fontSize: 12, marginTop: 3 },
  clientPhoneEmpty:{ color: '#2a2a2a', fontSize: 12, marginTop: 3, fontStyle: 'italic' },

  emptyTitle:  { color: '#555', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySubTxt: { color: '#333', fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  errTxt:      { color: '#555', fontSize: 14 },
  retryBtn:    { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryTxt:    { color: '#f05b22', fontWeight: '700' },
});
