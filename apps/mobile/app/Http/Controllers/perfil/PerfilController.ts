import { useState } from 'react';
import { RestriccionMedica } from '@gymsync/core';

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
