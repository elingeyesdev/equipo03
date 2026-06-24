import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PerfilDeportivo, RestriccionMedica, Identifier } from '@gymsync/core';

const PERFIL_KEY = '@gymsync_perfil_data';
const ALERTAS_KEY = '@gymsync_alertas_config';

export type AlertaFrequencia = 'AL_INICIAR' | 'ANTES_ENTRENAMIENTO' | 'AMBAS';

export interface AlertaConfig {
  globalEnabled: boolean;
  frecuencia: AlertaFrequencia;
  condicionesDesactivadas: string[]; // condiciones donde se silenciaron las alertas
}

export interface AlertaItem {
  condicion: string;
  severidad: 'BAJA' | 'MEDIA' | 'ALTA';
  recomendaciones?: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: AlertaConfig = {
  globalEnabled: true,
  frecuencia: 'AL_INICIAR',
  condicionesDesactivadas: [],
};

export const AlertasController = (medicalConditionsRaw?: string) => {
  const [config, setConfig] = useState<AlertaConfig>(DEFAULT_CONFIG);
  const [alertas, setAlertas] = useState<AlertaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      const perfilRaw = await AsyncStorage.getItem(PERFIL_KEY);
      const configRaw = await AsyncStorage.getItem(ALERTAS_KEY);
      const savedConfig: AlertaConfig = configRaw ? JSON.parse(configRaw) : DEFAULT_CONFIG;

      let items: AlertaItem[] = [];

      // Fuente 1: AsyncStorage (restriccionesMedicas legacy)
      if (perfilRaw) {
        const data = JSON.parse(perfilRaw);
        const restricciones: RestriccionMedica[] = (data.restriccionesMedicas || []).map(
          (r: any) => RestriccionMedica.create(r)
        );
        items = restricciones.map((r) => ({
          condicion: r.condicion,
          severidad: r.severidad,
          recomendaciones: r.recomendaciones,
          enabled: !savedConfig.condicionesDesactivadas.includes(r.condicion),
        }));
      }

      // Fuente 2: user.profile.medicalConditions del contexto (fallback)
      if (items.length === 0 && medicalConditionsRaw?.trim()) {
        const parts = medicalConditionsRaw.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
        items = parts.map(c => ({
          condicion: c,
          severidad: 'MEDIA' as const,
          recomendaciones: undefined,
          enabled: !savedConfig.condicionesDesactivadas.includes(c),
        }));
      }

      setConfig(savedConfig);
      setAlertas(items);
    } catch (e) {
      console.warn('Error cargando alertas:', (e as Error)?.message);
    } finally {
      setIsLoading(false);
    }
  }, [medicalConditionsRaw]);

  useEffect(() => {
    load();
  }, [load]);

  const saveConfig = async (newConfig: AlertaConfig) => {
    setConfig(newConfig);
    await AsyncStorage.setItem(ALERTAS_KEY, JSON.stringify(newConfig));
  };

  const toggleGlobal = async () => {
    const newConfig = { ...config, globalEnabled: !config.globalEnabled };
    await saveConfig(newConfig);
  };

  const setFrecuencia = async (f: AlertaFrequencia) => {
    const newConfig = { ...config, frecuencia: f };
    await saveConfig(newConfig);
  };

  const toggleAlerta = async (condicion: string) => {
    const desactivadas = [...config.condicionesDesactivadas];
    const idx = desactivadas.indexOf(condicion);
    if (idx >= 0) {
      desactivadas.splice(idx, 1);
    } else {
      desactivadas.push(condicion);
    }
    const newConfig = { ...config, condicionesDesactivadas: desactivadas };
    await saveConfig(newConfig);

    setAlertas((prev) =>
      prev.map((a) =>
        a.condicion === condicion ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  const dismissBanner = () => setBannerDismissed(true);

  // Alertas activas (habilitadas + global activo)
  const alertasActivas = config.globalEnabled
    ? alertas.filter((a) => a.enabled)
    : [];

  const alertasAltas = alertasActivas.filter((a) => a.severidad === 'ALTA');
  const alertasMedias = alertasActivas.filter((a) => a.severidad === 'MEDIA');

  const shouldShowBanner = !bannerDismissed && alertasActivas.length > 0;

  return {
    config,
    alertas,
    alertasActivas,
    alertasAltas,
    alertasMedias,
    isLoading,
    shouldShowBanner,
    toggleGlobal,
    setFrecuencia,
    toggleAlerta,
    dismissBanner,
    reload: load,
  };
};
