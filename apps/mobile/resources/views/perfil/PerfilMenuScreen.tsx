import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PerfilStackParamList } from '../../../routes/PerfilStack';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import authAxios from '../../../app/Providers/auth/authAxios';

type NavigationProp = NativeStackNavigationProp<PerfilStackParamList, 'Menu'>;

type MenuItem = {
  icon: string;
  label: string;
  action: () => void;
  premium?: boolean;
};

const formatRoleName = (role?: string) => {
  if (!role) return 'Usuario';
  if (role.toUpperCase() === 'USER') return 'Cliente';
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const AVATARS = [
  { id: '1',  icon: 'face-man-profile'  },
  { id: '2',  icon: 'face-woman-profile' },
  { id: '3',  icon: 'robot-outline'      },
  { id: '4',  icon: 'incognito'          },
  { id: '5',  icon: 'alien-outline'      },
  { id: '6',  icon: 'cat'               },
  { id: '7',  icon: 'fire'              },
  { id: '8',  icon: 'crown'             },
  { id: '9',  icon: 'star'              },
  { id: '10', icon: 'lightning-bolt'    },
  { id: '11', icon: 'skull-outline'     },
  { id: '12', icon: 'heart'             },
];

export const PerfilMenuScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, updateProfile } = useAuth();

  const userRole         = user?.role?.toUpperCase() ?? '';
  const userLevel        = (user as any)?.level ?? 0;
  const isGerente        = userLevel >= 4 || userRole === 'GERENTE' || userRole === 'COORDINADOR' || userRole === 'RECEPCIONISTA';
  const isStaffOperativo = !isGerente && (userLevel >= 3 || new Set(['ENTRENADOR', 'INSTRUCTOR', 'NUTRICIONISTA']).has(userRole));
  const isCliente        = !isGerente && !isStaffOperativo;
  const p           = (user as any)?.profile;
  const displayName = p?.username || (user as any)?.email?.split('@')[0] || 'Sin usuario';

  const [localAvatar,       setLocalAvatar]       = useState<string>(p?.avatarUrl || p?.avatarIcon || 'face-man-profile');
  const [pickerVisible,     setPickerVisible]     = useState(false);
  const [savingAvatar,      setSavingAvatar]      = useState(false);

  // ── Guardar avatar inmediatamente al elegir ──────────────────────────────────
  const handleAvatarSelect = async (icon: string) => {
    const prev = localAvatar;
    setLocalAvatar(icon);
    setSavingAvatar(true);
    try {
      await authAxios.patch('/api/users/me/profile', { avatarUrl: icon });
      updateProfile({ avatarUrl: icon });
      setPickerVisible(false);
    } catch {
      setLocalAvatar(prev);
      Alert.alert('Error', 'No se pudo guardar el avatar.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const userMenuItems: MenuItem[] = [
    { icon: 'account',   label: 'Mis datos personales', action: () => navigation.navigate('DatosPersonales') },
    ...(isCliente ? [
      { icon: 'chart-line',       label: 'Mi historial físico',   action: () => navigation.navigate('CuadroDeMando' as any) },
      { icon: 'trophy',           label: 'Mis objetivos',         action: () => navigation.navigate('MisObjetivos' as any) },
      { icon: 'dumbbell',         label: 'Mi Rutina',             action: () => navigation.navigate('MiRutina' as any) },
      { icon: 'food-apple-outline', label: 'Mi Plan Nutricional', action: () => navigation.navigate('MiPlan' as any) },
    ] : []),
    { icon: 'bell-ring',   label: 'Alertas de salud', action: () => navigation.navigate('AlertasConfig') },
    ...(isStaffOperativo ? [{ icon: 'card-account-details-outline', label: 'Mi Carnet Digital', action: () => navigation.navigate('CarnetDigital' as any), premium: true }] : []),
    { icon: 'cog-outline', label: 'Ajustes',           action: () => navigation.navigate('Ajustes' as any) },
  ];

  const gerenteMenuItems: MenuItem[] = [
    { icon: 'account',              label: 'Mis datos personales',  action: () => navigation.navigate('DatosPersonales') },
    { icon: 'shield-check-outline', label: 'Auditoría de Sucursal', action: () => navigation.navigate('AuditoriaSucursal' as any), premium: true },
    { icon: 'bell-ring',            label: 'Alertas de salud',      action: () => navigation.navigate('AlertasConfig') },
    { icon: 'cog-outline',          label: 'Ajustes',               action: () => navigation.navigate('Ajustes' as any) },
  ];

  const menuItems = isGerente ? gerenteMenuItems : userMenuItems;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── Header ── */}
        <View style={styles.header}>

          {/* Avatar — toca para abrir picker */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name={localAvatar as any} size={60} color="#f05b22" />
            <View style={styles.avatarEditBadge}>
              <MaterialCommunityIcons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.roleText}>{formatRoleName(user?.role)}</Text>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('DatosPersonales')}>
            <Text style={styles.editBtnText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ── Menú ── */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, item.premium && styles.menuItemPremium]}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color="#f05b22" style={styles.menuIcon} />
                <Text style={[styles.menuLabel, item.premium && styles.menuLabelPremium]}>{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={item.premium ? '#f05b22' : '#666'} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* ── Modal picker de avatares ── */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !savingAvatar && setPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => !savingAvatar && setPickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Elige tu Avatar</Text>

            {savingAvatar ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#f05b22" />
                <Text style={styles.modalLoadingText}>Guardando...</Text>
              </View>
            ) : (
              <View style={styles.avatarGrid}>
                {AVATARS.map((av) => (
                  <TouchableOpacity
                    key={av.id}
                    style={[styles.avatarOption, localAvatar === av.icon && styles.avatarOptionSelected]}
                    onPress={() => handleAvatarSelect(av.icon)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={av.icon as any}
                      size={42}
                      color={localAvatar === av.icon ? '#f05b22' : '#999'}
                    />
                    {localAvatar === av.icon && (
                      <View style={styles.avatarCheckBadge}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#f05b22" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#000000' },
  scrollContent:        { paddingBottom: 120 },

  // ── Header ──
  header:               { alignItems: 'center', paddingVertical: 40, backgroundColor: '#0a0a0a', borderBottomWidth: 1, borderBottomColor: '#111' },
  avatarContainer:      { width: 110, height: 110, borderRadius: 55, backgroundColor: '#161618', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#333', shadowColor: '#f05b22', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  avatarEditBadge:      { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#f05b22', borderRadius: 10, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  headerInfo:           { alignItems: 'center', marginBottom: 20 },
  username:             { color: '#ffffff', fontSize: 26, fontWeight: '900' },
  roleText:             { color: '#888', fontSize: 14, marginTop: 4 },
  editBtn:              { backgroundColor: '#f05b22', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25, shadowColor: '#f05b22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  editBtnText:          { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  // ── Menú ──
  menuContainer:        { paddingHorizontal: 20, marginTop: 10 },
  menuItem:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#161618' },
  menuItemPremium:      { backgroundColor: '#1C1C1E', marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 12, borderBottomColor: 'transparent', borderWidth: 1, borderColor: '#FF5E00', marginVertical: 6 },
  menuItemLeft:         { flexDirection: 'row', alignItems: 'center' },
  menuIcon:             { marginRight: 20 },
  menuLabel:            { color: '#ffffff', fontSize: 16, fontWeight: '500' },
  menuLabelPremium:     { color: '#f05b22', fontWeight: '700' },

  // ── Modal ──
  modalBackdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet:           { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#3A3A3C', padding: 24, paddingBottom: 40 },
  modalHandle:          { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle:           { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  modalLoading:         { alignItems: 'center', paddingVertical: 40, gap: 12 },
  modalLoadingText:     { color: '#888', fontSize: 14 },
  avatarGrid:           { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  avatarOption:         { width: '23%', aspectRatio: 1, backgroundColor: '#1a1a1a', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  avatarOptionSelected: { borderColor: '#f05b22', backgroundColor: '#2a1a15' },
  avatarCheckBadge:     { position: 'absolute', top: 4, right: 4 },
});
