import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { staffApi, MyStudent } from '../../../app/Providers/staff/api/staff.api';

const studentName = (s: MyStudent) =>
  (s.name ?? [s.firstName, s.lastName].filter(Boolean).join(' ')) || `Alumno #${s.id}`;

export const TrainerDashboard = () => {
  const { user }   = useAuth();
  const navigation = useNavigation<any>();
  const firstName  = (user as any)?.profile?.firstName ?? (user as any)?.firstName ?? 'Entrenador';
  const hora    = new Date().getHours();
  const saludo  = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  const { data: students = [], isLoading, isError, refetch } = useQuery({
    queryKey:  ['trainer-students'],
    queryFn:   staffApi.getMyStudents,
    staleTime: 60_000,
    retry: 1,
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.saludo}>{saludo},</Text>
          <Text style={s.nombre}>{firstName}</Text>
          <Text style={s.sub}>Mis Alumnos (Vía Rutinas)</Text>
        </View>
        <View style={s.avatar}>
          <MaterialCommunityIcons name="dumbbell" size={28} color="#f05b22" />
        </View>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={s.center}>
          <ActivityIndicator color="#f05b22" size="large" />
          <Text style={s.soft}>Cargando alumnos…</Text>
        </View>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <View style={s.center}>
          <MaterialCommunityIcons name="wifi-off" size={40} color="#333" />
          <Text style={s.soft}>No se pudo cargar la lista.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()}>
            <Text style={s.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {!isLoading && !isError && (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <MaterialCommunityIcons name="account-group-outline" size={52} color="#222" />
              <Text style={s.emptyTitle}>Aún no tienes alumnos asignados a rutinas.</Text>
            </View>
          }
          ListHeaderComponent={
            students.length > 0 ? (
              <View style={s.summaryCard}>
                <Text style={s.summaryNum}>{students.length}</Text>
                <Text style={s.summaryLabel}>Alumnos asignados</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardLeft}>
                <View style={s.iconBadge}>
                  <MaterialCommunityIcons name="account-outline" size={22} color="#f05b22" />
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{studentName(item)}</Text>
                  {!!item.email && (
                    <Text style={s.cardEmail} numberOfLines={1}>{item.email}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={s.expBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AsignarRutina', {
                  studentId:   item.id,
                  studentName: studentName(item),
                })}
              >
                <Text style={s.expBtnTxt}>Ver Expediente</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
  headerLeft: { flex: 1 },
  saludo:     { color: '#555', fontSize: 14 },
  nombre:     { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 2 },
  sub:        { color: '#444', fontSize: 13, marginTop: 4 },
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1c1c1e', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(240,91,34,0.3)' },

  list:       { paddingHorizontal: 16, paddingBottom: 100 },

  summaryCard: { backgroundColor: '#0e0e0e', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  summaryNum:  { color: '#fff', fontSize: 28, fontWeight: '900' },
  summaryLabel:{ color: '#444', fontSize: 12, marginTop: 2 },

  card:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0e0e0e', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a1a', gap: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  iconBadge:{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(240,91,34,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(240,91,34,0.2)' },
  cardInfo: { flex: 1 },
  cardName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardEmail:{ color: '#555', fontSize: 11, marginTop: 2 },

  expBtn:   { backgroundColor: '#1a1a1a', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  expBtnTxt:{ color: '#f05b22', fontSize: 12, fontWeight: '700' },

  emptyTitle:{ color: '#555', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  soft:      { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 6 },
  retryBtn:  { marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#f05b22' },
  retryTxt:  { color: '#f05b22', fontWeight: '600' },
});
