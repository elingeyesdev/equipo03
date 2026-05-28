import { useState } from 'react';
import { RestriccionMedica } from '@gymsync/core';

// TODO-BACKEND: Las restricciones médicas necesitan endpoint propio en el API.
// Sugerencia: PATCH /api/users/me/restrictions
// Por ahora el estado es en memoria (se resetea al cerrar la app).
// Las métricas físicas (peso, altura, nivel) se gestionan en MisDatosPersonalesScreen.

export const PerfilController = () => {
  const [restriccionesMedicas, setRestriccionesMedicas] = useState<RestriccionMedica[]>([]);

  const [nuevaCondicion,        setNuevaCondicion]        = useState('');
  const [nuevaSeveridad,        setNuevaSeveridad]        = useState<'BAJA' | 'MEDIA' | 'ALTA'>('BAJA');
  const [nuevasRecomendaciones, setNuevasRecomendaciones] = useState('');

  const handleAddedRestriccion = async () => {
    if (!nuevaCondicion) return false;
    try {
      const nueva = RestriccionMedica.create({
        condicion:       nuevaCondicion,
        severidad:       nuevaSeveridad,
        recomendaciones: nuevasRecomendaciones,
      });
      setRestriccionesMedicas(prev => [...prev, nueva]);
      setNuevaCondicion('');
      setNuevasRecomendaciones('');
      setNuevaSeveridad('BAJA');
      return true;
    } catch {
      return false;
    }
  };

  const handleRemoveRestriccion = (condicion: string) => {
    setRestriccionesMedicas(prev => prev.filter(r => r.condicion !== condicion));
  };

  return {
    restriccionesMedicas,
    nuevaCondicion,        setNuevaCondicion,
    nuevaSeveridad,        setNuevaSeveridad,
    nuevasRecomendaciones, setNuevasRecomendaciones,
    handleAddedRestriccion,
    handleRemoveRestriccion,
  };
};
