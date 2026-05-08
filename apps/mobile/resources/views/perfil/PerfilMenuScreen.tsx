import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PerfilStackParamList } from '../../../routes/PerfilStack';
import { useAuth } from '../../../app/Shared/hooks/useAuth';

type NavigationProp = NativeStackNavigationProp<PerfilStackParamList, 'Menu'>;

export const PerfilMenuScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  // Datos dinámicos del usuario
  const displayName = user?.profile?.username || user?.profile?.firstName || user?.email?.split('@')[0] || 'Usuario';
  const avatarIcon = user?.profile?.avatarIcon || 'face-man-profile';
  const sports = user?.profile?.favoriteSports || 'Sin deportes favoritos';

  const menuItems = [
    { 
      icon: 'account', 
      label: 'Mis datos personales', 
      action: () => navigation.navigate('DatosPersonales') 
    },
    { icon: 'human-handsup', label: 'Mis datos físicos', action: () => navigation.navigate('Manager') },
    { icon: 'trophy', label: 'Mis objetivos', action: () => {} },
    { icon: 'medical-bag', label: 'Mis restricciones medicas', action: () => navigation.navigate('Manager') },
    { icon: 'bell-ring', label: 'Alertas de salud', action: () => navigation.navigate('AlertasConfig') },
    { icon: 'clock-outline', label: 'Mi historial de actividad', action: () => {} },
    { icon: 'cog-outline', label: 'Ajustes', action: () => navigation.navigate('Ajustes' as any) },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name={avatarIcon as any} size={60} color="#f05b22" />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.sportsText}>{sports}</Text>
          
          <TouchableOpacity 
            style={styles.progressBtn}
            onPress={() => navigation.navigate('DatosPersonales')}
          >
            <Text style={styles.progressBtnText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color="#f05b22" style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>
          ))}
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
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#161618',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#f05b22',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  name: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 4,
  },
  sportsText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  progressBtn: {
    backgroundColor: '#f05b22',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    shadowColor: '#f05b22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  progressBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#161618',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 20,
  },
  menuLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
