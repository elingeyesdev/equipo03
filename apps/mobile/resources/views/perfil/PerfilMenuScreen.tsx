import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PerfilStackParamList } from '../../../routes/PerfilStack';

type NavigationProp = NativeStackNavigationProp<PerfilStackParamList, 'Menu'>;

export const PerfilMenuScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const menuItems = [
    { icon: 'account', label: 'Mis datos personales', action: () => {} },
    { icon: 'human-handsup', label: 'Mis datos físicos', action: () => navigation.navigate('Manager') },
    { icon: 'trophy', label: 'Mis objetivos', action: () => {} },
    { icon: 'medical-bag', label: 'Mis restricciones medicas', action: () => navigation.navigate('Manager') },
    { icon: 'bell-ring', label: 'Alertas de salud', action: () => navigation.navigate('AlertasConfig') },
    { icon: 'clock-outline', label: 'Mi historial de actividad', action: () => {} },
    { icon: 'cog-outline', label: 'Ajustes', action: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="face-man-profile" size={60} color="#ccc" />
          </View>
          <Text style={styles.name}>Julian Thorne</Text>
          <TouchableOpacity style={styles.progressBtn}>
            <Text style={styles.progressBtnText}>Ver mi progreso</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color="#ccc" style={styles.menuIcon} />
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressBtn: {
    backgroundColor: '#f05b22',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  progressBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    color: '#ffffff',
    fontSize: 16,
  },
});
