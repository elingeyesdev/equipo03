import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PerfilStackParamList } from '../../../routes/PerfilStack';
import { useAuth } from '../../../app/Shared/hooks/useAuth';

type NavigationProp = NativeStackNavigationProp<PerfilStackParamList, 'Menu'>;

type MenuItem = {
  icon: string;
  label: string;
  action: () => void;
  premium?: boolean;
};

export const PerfilMenuScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const isGerente   = user?.role === 'GERENTE';
  const p           = user?.profile as any;
  const displayName = p?.firstName
    ? [p.firstName, p.lastName].filter(Boolean).join(' ')
    : p?.username || p?.email?.split('@')[0] || (user as any)?.email?.split('@')[0] || 'Usuario';
  const avatarIcon  = p?.avatarIcon || 'face-man-profile';
  const sports      = p?.favoriteSports;

  const userMenuItems: MenuItem[] = [
    { icon: 'account',          label: 'Mis datos personales',        action: () => navigation.navigate('DatosPersonales') },
    { icon: 'human-handsup',    label: 'Mis datos físicos',           action: () => navigation.navigate('Manager') },
    { icon: 'trophy',           label: 'Mis objetivos',               action: () => {} },
    { icon: 'medical-bag',      label: 'Mis restricciones medicas',   action: () => navigation.navigate('Manager') },
    { icon: 'bell-ring',        label: 'Alertas de salud',            action: () => navigation.navigate('AlertasConfig') },
    { icon: 'clock-outline',    label: 'Mi historial de actividad',   action: () => {} },
    { icon: 'cog-outline',      label: 'Ajustes',                     action: () => navigation.navigate('Ajustes' as any) },
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

        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name={avatarIcon as any} size={60} color="#f05b22" />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {isGerente ? (
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="shield-account" size={14} color="#f05b22" />
              <Text style={styles.roleBadgeTxt}>Gerente de Sucursal</Text>
            </View>
          ) : (
            !!sports && <Text style={styles.sportsText}>{sports}</Text>
          )}
          <TouchableOpacity style={styles.progressBtn} onPress={() => navigation.navigate('DatosPersonales')}>
            <Text style={styles.progressBtnText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, item.premium && styles.menuItemPremium]}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={24}
                  color={item.premium ? '#f05b22' : '#f05b22'}
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuLabel, item.premium && styles.menuLabelPremium]}>
                  {item.label}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={item.premium ? 'chevron-right' : 'chevron-right'}
                size={24}
                color={item.premium ? '#f05b22' : '#666'}
              />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000000' },
  scrollContent:    { paddingBottom: 120 },
  header:           { alignItems: 'center', paddingVertical: 40, backgroundColor: '#0a0a0a', borderBottomWidth: 1, borderBottomColor: '#111' },
  avatarContainer:  { width: 110, height: 110, borderRadius: 55, backgroundColor: '#161618', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#333', shadowColor: '#f05b22', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  name:             { color: '#ffffff', fontSize: 26, fontWeight: '900', marginBottom: 4 },
  sportsText:       { color: '#666', fontSize: 14, marginBottom: 20, fontStyle: 'italic' },
  roleBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(240,91,34,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(240,91,34,0.3)', marginBottom: 20 },
  roleBadgeTxt:     { color: '#f05b22', fontSize: 13, fontWeight: '700' },
  progressBtn:      { backgroundColor: '#f05b22', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25, shadowColor: '#f05b22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  progressBtnText:  { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  menuContainer:    { paddingHorizontal: 20, marginTop: 10 },
  menuItem:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#161618' },
  menuItemPremium:  { backgroundColor: 'rgba(240,91,34,0.06)', marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 12, borderBottomColor: 'transparent', borderWidth: 1, borderColor: 'rgba(240,91,34,0.2)', marginVertical: 6 },
  menuItemLeft:     { flexDirection: 'row', alignItems: 'center' },
  menuIcon:         { marginRight: 20 },
  menuLabel:        { color: '#ffffff', fontSize: 16, fontWeight: '500' },
  menuLabelPremium: { color: '#f05b22', fontWeight: '700' },
});
