import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../app/Shared/hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

const AVATARS = [
  { id: '1', icon: 'face-man-profile', name: 'Man 1' },
  { id: '2', icon: 'face-woman-profile', name: 'Woman 1' },
  { id: '3', icon: 'robot-outline', name: 'Robot' },
  { id: '4', icon: 'incognito', name: 'Ghost' },
  { id: '5', icon: 'alien-outline', name: 'Alien' },
  { id: '6', icon: 'cat', name: 'Cat' },
  { id: '7', icon: 'fire', name: 'Fuego' },
  { id: '8', icon: 'crown', name: 'Corona' },
  { id: '9', icon: 'star', name: 'Estrella' },
];

export const MisDatosPersonalesScreen = () => {
  const { user, updateProfile } = useAuth();
  const navigation = useNavigation();

  const [username, setUsername] = useState(user?.profile?.username || user?.email?.split('@')[0] || '');
  const [firstName, setFirstName] = useState(user?.profile?.firstName || '');
  const [lastName, setLastName] = useState(user?.profile?.lastName || '');
  const [gender, setGender] = useState(user?.profile?.gender || 'Masculino');
  const [favoriteSports, setFavoriteSports] = useState(user?.profile?.favoriteSports || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile?.avatarIcon || 'face-man-profile');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Listeners para el teclado en iOS
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleSave = () => {
    updateProfile({
      username,
      firstName,
      lastName,
      gender,
      favoriteSports,
      avatarIcon: selectedAvatar,
    });
    Alert.alert('Éxito', 'Perfil actualizado correctamente');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Avatar Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Elige tu Avatar</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar.icon && styles.avatarSelected,
                  ]}
                  onPress={() => setSelectedAvatar(avatar.icon)}
                >
                  <MaterialCommunityIcons
                    name={avatar.icon as any}
                    size={40}
                    color={selectedAvatar === avatar.icon ? '#f05b22' : '#ccc'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Form */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Información Básica</Text>
              
              {/* Botón para ocultar teclado (Solo iOS) */}
              {Platform.OS === 'ios' && isKeyboardVisible && (
                <TouchableOpacity 
                  style={styles.dismissButton} 
                  onPress={() => Keyboard.dismiss()}
                >
                  <Text style={styles.dismissButtonText}>LISTO</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de Usuario</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Tu nombre de usuario"
                placeholderTextColor="#555"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Tu nombre"
                placeholderTextColor="#555"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Tu apellido"
                placeholderTextColor="#555"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Género</Text>
              <View style={styles.genderContainer}>
                {['Masculino', 'Femenino', 'Otro'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnSelected]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextSelected]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Favorite Sports */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalización</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deportes Favoritos</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={favoriteSports}
                onChangeText={setFavoriteSports}
                placeholder="Ej: Calistenia, Natación, Yoga..."
                placeholderTextColor="#555"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Guardar Cambios</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Ajuste para que el botón de guardar sea visible al final
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarOption: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#f05b22',
    backgroundColor: '#2a1a15',
  },
  dismissButton: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  dismissButtonText: {
    color: '#f05b22',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#161618',
    borderRadius: 12,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#161618',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  genderBtnSelected: {
    backgroundColor: '#f05b22',
    borderColor: '#f05b22',
  },
  genderBtnText: {
    color: '#888',
    fontWeight: '600',
  },
  genderBtnTextSelected: {
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: '#f05b22',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#f05b22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
