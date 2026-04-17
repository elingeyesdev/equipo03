import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PerfilDeportivo, RestriccionMedica, Identifier, type NivelExperiencia } from '@gymsync/core';

const ASYNC_STORAGE_KEY = '@gymsync_perfil_data';

export const PerfilController = () => {
  const [perfil, setPerfil] = useState<PerfilDeportivo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states - Perfil
  const [pesoInput, setPesoInput] = useState('');
  const [alturaInput, setAlturaInput] = useState('');
  const [experienciaInput, setExperienciaInput] = useState<NivelExperiencia>('PRINCIPIANTE');

  // Form states - Restricción
  const [nuevaCondicion, setNuevaCondicion] = useState('');
  const [nuevaSeveridad, setNuevaSeveridad] = useState<'BAJA' | 'MEDIA' | 'ALTA'>('BAJA');
  const [nuevasRecomendaciones, setNuevasRecomendaciones] = useState('');

  useEffect(() => {
    loadPerfil();
  }, []);

  const initDefault = () => {
    const p = PerfilDeportivo.create({
      id: Identifier.create('user-1'),
      pesoKg: 70,
      alturaCm: 175,
      nivelExperiencia: 'PRINCIPIANTE',
      objetivos: ['MANTENIMIENTO'],
      restriccionesMedicas: [],
    });
    setPerfil(p);
    setPesoInput('70');
    setAlturaInput('175');
    setExperienciaInput('PRINCIPIANTE');
    setIsLoading(false);
  };

  const loadPerfil = async () => {
    try {
      const saved = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const p = PerfilDeportivo.create({
          id: Identifier.create(data.id),
          pesoKg: data.pesoKg,
          alturaCm: data.alturaCm,
          nivelExperiencia: data.nivelExperiencia,
          objetivos: data.objetivos || [],
          restriccionesMedicas: (data.restriccionesMedicas || []).map((r: any) => RestriccionMedica.create(r)),
        });
        setPerfil(p);
        setPesoInput(data.pesoKg.toString());
        setAlturaInput(data.alturaCm.toString());
        setExperienciaInput(data.nivelExperiencia);
      } else {
        initDefault();
      }
    } catch (e) {
      console.error('Error parseando perfil:', e);
      initDefault();
    } finally {
      setIsLoading(false);
    }
  };

  const syncToStorage = async (p: PerfilDeportivo) => {
    setPerfil(p);
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(p.toDTO()));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  };

  const handleUpdateMetricas = async () => {
    if (!perfil) return false;
    try {
      const p = PerfilDeportivo.create({
        ...perfil.toDTO(),
        id: perfil.id,
        pesoKg: parseFloat(pesoInput) || 70,
        alturaCm: parseFloat(alturaInput) || 175,
        nivelExperiencia: experienciaInput,
        restriccionesMedicas: perfil.restriccionesMedicas
      });
      await syncToStorage(p);
      return true;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  };

  const handleAddedRestriccion = async () => {
    if (!perfil || !nuevaCondicion) return false;
    try {
      const pDto = perfil.toDTO();
      const p = PerfilDeportivo.create({
        ...pDto,
        id: perfil.id,
        restriccionesMedicas: [
          ...perfil.restriccionesMedicas,
          RestriccionMedica.create({
            condicion: nuevaCondicion,
            severidad: nuevaSeveridad,
            recomendaciones: nuevasRecomendaciones
          })
        ]
      });
      await syncToStorage(p);
      setNuevaCondicion('');
      setNuevasRecomendaciones('');
      setNuevaSeveridad('BAJA');
      return true;
    } catch (err: any) {
      console.error(err);
      return false;
    }
  };

  const handleRemoveRestriccion = async (condicion: string) => {
    if (!perfil) return;
    const pDto = perfil.toDTO();
    const p = PerfilDeportivo.create({
      ...pDto,
      id: perfil.id,
      restriccionesMedicas: perfil.restriccionesMedicas.filter(r => r.condicion !== condicion)
    });
    await syncToStorage(p);
  };

  return {
    perfil,
    isLoading,
    
    pesoInput,
    setPesoInput,
    alturaInput,
    setAlturaInput,
    experienciaInput,
    setExperienciaInput,
    
    nuevaCondicion,
    setNuevaCondicion,
    nuevaSeveridad,
    setNuevaSeveridad,
    nuevasRecomendaciones,
    setNuevasRecomendaciones,
    
    handleUpdateMetricas,
    handleAddedRestriccion,
    handleRemoveRestriccion,
  };
};
