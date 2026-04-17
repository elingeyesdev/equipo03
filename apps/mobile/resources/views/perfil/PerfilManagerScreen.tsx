import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { PerfilController } from '../../../app/Http/Controllers/perfil/PerfilController';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NivelExperiencia } from '@gymsync/core';

export const PerfilManagerScreen = () => {
  const vm = PerfilController();

  if (vm.isLoading || !vm.perfil) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.textWhite}>Cargando perfil...</Text>
      </View>
    );
  }

  const handleSave = async () => {
    const ok = await vm.handleUpdateMetricas();
    if (ok) {
      Alert.alert('Éxito', 'Perfil actualizado con éxito');
    } else {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  const handleAddRestriccion = async () => {
    if (!vm.nuevaCondicion) {
      Alert.alert('Aviso', 'Debe ingresar al menos la condición o lesión.');
      return;
    }
    const ok = await vm.handleAddedRestriccion();
    if (ok) {
      Alert.alert('Agregado', 'Condición registrada');
    }
  };

  const imc = vm.perfil.imc;
  let imcClass = styles.imcNormal;
  let imcText = 'Normal';
  if (imc < 18.5) {
    imcClass = styles.imcWarning;
    imcText = 'Bajo peso';
  } else if (imc >= 25 && imc < 30) {
    imcClass = styles.imcWarning;
    imcText = 'Sobrepeso';
  } else if (imc >= 30) {
    imcClass = styles.imcDanger;
    imcText = 'Obesidad';
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.title}>Gestor de Perfil Atleta</Text>
        <Text style={styles.subtitle}>Administra tu información biométrica y condiciones de salud.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Métricas Físicas</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={vm.pesoInput}
              onChangeText={vm.setPesoInput}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Altura (cm)</Text>
            <TextInput 
              style={styles.input}
              keyboardType="numeric"
              value={vm.alturaInput}
              onChangeText={vm.setAlturaInput}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nivel de Experiencia</Text>
            <View style={styles.radioGroup}>
              {['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'].map(lvl => (
                <TouchableOpacity 
                  key={lvl}
                  style={[styles.radioItem, vm.experienciaInput === lvl && styles.radioItemActive]}
                  onPress={() => vm.setExperienciaInput(lvl as NivelExperiencia)}
                >
                  <Text style={[styles.radioText, vm.experienciaInput === lvl && styles.radioTextActive]}>
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.imcBadge, imcClass]}>
            <Text style={styles.imcBadgeText}>IMC Computado: {imc.toFixed(1)} ({imcText})</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
            <Text style={styles.primaryBtnText}>Guardar Métricas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚕️ Restricciones y Cuidados Médicos</Text>
          
          {vm.perfil.restriccionesMedicas.length === 0 ? (
            <Text style={styles.emptyText}>No hay restricciones registradas. Todo en orden. 🚀</Text>
          ) : (
             <View style={styles.restriccionesList}>
               {vm.perfil.restriccionesMedicas.map((r) => (
                 <View key={r.condicion} style={[styles.restriccionItem, r.severidad === 'ALTA' && styles.restriccionItemAlta]}>
                   <View style={styles.restriccionInfo}>
                     <Text style={styles.restriccionTitle}>{r.condicion}</Text>
                     <Text style={styles.restriccionDesc}>{r.recomendaciones || 'Sin recomendaciones'}</Text>
                   </View>
                   <View style={styles.restriccionRight}>
                     <Text style={[styles.severidadText, r.severidad === 'ALTA' && styles.severidadTextAlta]}>
                       {r.severidad}
                     </Text>
                     <TouchableOpacity onPress={() => vm.handleRemoveRestriccion(r.condicion)}>
                       <MaterialCommunityIcons name="delete" size={24} color="#ff4444" />
                     </TouchableOpacity>
                   </View>
                 </View>
               ))}
             </View>
          )}

          <View style={styles.addForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Condición Médica / Lesión</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej. Asma, Lesión de rodilla"
                placeholderTextColor="#666"
                value={vm.nuevaCondicion}
                onChangeText={vm.setNuevaCondicion}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Peligrosidad</Text>
              <View style={styles.radioGroup}>
                {['BAJA', 'MEDIA', 'ALTA'].map(sev => (
                  <TouchableOpacity 
                    key={sev}
                    style={[styles.radioItem, vm.nuevaSeveridad === sev && styles.radioItemActive]}
                    onPress={() => vm.setNuevaSeveridad(sev as any)}
                  >
                    <Text style={[styles.radioText, vm.nuevaSeveridad === sev && styles.radioTextActive]}>
                       {sev}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cuidados Especiales (Opcional)</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej. Evitar impactos..."
                placeholderTextColor="#666"
                value={vm.nuevasRecomendaciones}
                onChangeText={vm.setNuevasRecomendaciones}
              />
            </View>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleAddRestriccion}>
               <Text style={styles.secondaryBtnText}>+ Registrar Condición</Text>
            </TouchableOpacity>
          </View>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWhite: {
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioItem: {
    flex: 1,
    backgroundColor: '#222',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  radioItemActive: {
    backgroundColor: '#f05b22',
  },
  radioText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  radioTextActive: {
    color: '#fff',
  },
  imcBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  imcNormal: {
    backgroundColor: '#2e7d32',
  },
  imcWarning: {
    backgroundColor: '#e65100',
  },
  imcDanger: {
    backgroundColor: '#c62828',
  },
  imcBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  primaryBtn: {
    backgroundColor: '#00cc99',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#f05b22',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#f05b22',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  restriccionesList: {
    marginBottom: 20,
    gap: 12,
  },
  restriccionItem: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restriccionItemAlta: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  restriccionInfo: {
    flex: 1,
  },
  restriccionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  restriccionDesc: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  restriccionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severidadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f0ad4e',
  },
  severidadTextAlta: {
    color: '#ff4444',
  },
  addForm: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
  }
});
