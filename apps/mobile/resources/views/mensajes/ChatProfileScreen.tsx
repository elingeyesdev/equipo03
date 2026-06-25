import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { userApi } from '../../../app/Providers/users/api/user.api';

export const ChatProfileScreen = ({ route }: any) => {
  const { targetUserId } = route.params as { targetUserId: number };
  const navigation = useNavigation();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['chat-profile', targetUserId],
    queryFn:  () => userApi.getChatProfile(targetUserId),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#f05b22" />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.errorHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.errorBody}>
          <MaterialCommunityIcons name="account-off-outline" size={52} color="#3A3A3C" />
          <Text style={s.errorText}>No se pudo cargar el perfil</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName  = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Usuario';
  const isClient  = profile.level <= 1;

  return (
    <SafeAreaView style={s.container} edges={['top']}>

      {/* Header con botón de retroceso */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Información de contacto</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Avatar + nombre + rol */}
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <MaterialCommunityIcons name="account-circle" size={100} color="#3A3A3C" />
          </View>
          <Text style={s.nameText}>{fullName}</Text>
          <Text style={s.roleText}>{profile.roleName}</Text>
        </View>

        {/* Tarjetas de información */}
        <View style={s.infoSection}>

          <View style={s.card}>
            <View style={s.cardIcon}>
              <MaterialCommunityIcons name="gender-male-female" size={18} color="#f05b22" />
            </View>
            <View style={s.cardBody}>
              <Text style={s.label}>Género</Text>
              <Text style={s.value}>{profile.gender}</Text>
            </View>
          </View>

          {/* Solo staff (nivel > 1) ve marca y sucursal */}
          {!isClient && (
            <>
              <View style={s.card}>
                <View style={s.cardIcon}>
                  <MaterialCommunityIcons name="office-building-outline" size={18} color="#f05b22" />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.label}>Marca</Text>
                  <Text style={s.value}>{profile.brandName ?? 'No asignada'}</Text>
                </View>
              </View>

              <View style={s.card}>
                <View style={s.cardIcon}>
                  <MaterialCommunityIcons name="dumbbell" size={18} color="#f05b22" />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.label}>Sucursal asignada</Text>
                  <Text style={s.value}>{profile.branchName ?? 'No asignada'}</Text>
                </View>
              </View>
            </>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0A0A0A' },
  loadingContainer:{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },

  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1C1C1E', gap: 10 },
  backBtn:     { padding: 4 },
  topBarTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },

  scroll: { paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingVertical: 36, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
  avatarCircle:  { marginBottom: 4 },
  nameText:      { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 8 },
  roleText:      { color: '#f05b22', fontSize: 14, marginTop: 4, fontWeight: '500' },

  infoSection: { padding: 16, gap: 10 },
  card:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#1C1C1E', padding: 16, gap: 14 },
  cardIcon:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  cardBody:    { flex: 1 },
  label:       { color: '#666', fontSize: 11, textTransform: 'uppercase', marginBottom: 3 },
  value:       { color: '#fff', fontSize: 15 },

  errorHeader: { paddingHorizontal: 12, paddingVertical: 12 },
  errorBody:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText:   { color: '#555', fontSize: 14 },
});
