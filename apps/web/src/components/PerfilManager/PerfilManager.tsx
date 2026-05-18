import React, { useState, useEffect } from 'react';
import {
  PerfilDeportivo,
  RestriccionMedica,
  Identifier,
  type NivelExperiencia
} from '@gymsync/core';
import './PerfilManager.css';

// Mock initial data or load from localStorage
const LOCAL_STORAGE_KEY = 'gymsync_perfil_data';

export const PerfilManager: React.FC = () => {
  const [perfil, setPerfil] = useState<PerfilDeportivo | null>(null);

  // Form states - Perfil
  const [pesoInput, setPesoInput] = useState('');
  const [alturaInput, setAlturaInput] = useState('');
  const [experienciaInput, setExperienciaInput] = useState<NivelExperiencia>('PRINCIPIANTE');

  // Form states - Restricción
  const [nuevaCondicion, setNuevaCondicion] = useState('');
  const [nuevaSeveridad, setNuevaSeveridad] = useState<'BAJA' | 'MEDIA' | 'ALTA'>('BAJA');
  const [nuevasRecomendaciones, setNuevasRecomendaciones] = useState('');

  // Load from localStorage or initialize default
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
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
      } catch (e) {
        console.error('Error parseando perfil:', e);
        initDefault();
      }
    } else {
      initDefault();
    }
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
  };

  const syncToStorage = (p: PerfilDeportivo) => {
    setPerfil(p);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(p.toDTO()));
  };

  const handleUpdateMetricas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil) return;
    try {
      const p = PerfilDeportivo.create({
        ...perfil.toDTO(),
        id: perfil.id, // maintain instance
        pesoKg: parseFloat(pesoInput) || 70,
        alturaCm: parseFloat(alturaInput) || 175,
        nivelExperiencia: experienciaInput,
        restriccionesMedicas: perfil.restriccionesMedicas
      });
      syncToStorage(p);
      alert('Perfil deportivo actualizado con éxito.');
    } catch (err: any) {
      alert(`Error al actualizar: ${err.message}`);
    }
  };

  const handleAddedRestriccion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil || !nuevaCondicion) return;
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
      syncToStorage(p);
      setNuevaCondicion('');
      setNuevasRecomendaciones('');
      setNuevaSeveridad('BAJA');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRemoveRestriccion = (condicion: string) => {
    if (!perfil) return;
    const pDto = perfil.toDTO();
    const p = PerfilDeportivo.create({
      ...pDto,
      id: perfil.id,
      restriccionesMedicas: perfil.restriccionesMedicas.filter(r => r.condicion !== condicion)
    });
    syncToStorage(p);
  };

  if (!perfil) return <div className="loader">Cargando perfil base...</div>;

  const imc = perfil.imc;
  let imcClass = 'normal';
  if (imc < 18.5 || imc >= 25) imcClass = 'warning';
  if (imc >= 30) imcClass = 'danger';

  return (
    <div className="perfil-manager-container">
      <div className="perfil-header">
        <h2>Gestor de Perfil Atleta</h2>
        <p>Administra tu información biométrica y condiciones de salud.</p>
      </div>

      <div className="perfil-section">
        <h3>📊 Métricas Físicas</h3>
        <form onSubmit={handleUpdateMetricas}>
          <div className="perfil-grid">
            <div className="form-group">
              <label>Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                min="30"
                className="form-input"
                value={pesoInput}
                onChange={(e) => setPesoInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Altura (cm)</label>
              <input
                type="number"
                min="100"
                className="form-input"
                value={alturaInput}
                onChange={(e) => setAlturaInput(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Nivel de Experiencia</label>
              <select
                className="form-select"
                value={experienciaInput}
                onChange={(e) => setExperienciaInput(e.target.value as NivelExperiencia)}
              >
                <option value="PRINCIPIANTE">Principiante</option>
                <option value="INTERMEDIO">Intermedio</option>
                <option value="AVANZADO">Avanzado</option>
              </select>
            </div>
          </div>

          <div className={`imc-badge ${imcClass}`}>
            IMC Computado: {imc.toFixed(1)}
          </div>

          <button type="submit" className="btn-primary" style={{ display: 'block', marginTop: '20px' }}>
            Guardar Métricas
          </button>
        </form>
      </div>

      <div className="perfil-section">
        <h3>⚕️ Restricciones y Cuidados Médicos</h3>
        {perfil.restriccionesMedicas.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No hay restricciones registradas. Todo en orden. 🚀</p>
        ) : (
          <div className="restricciones-list">
            {perfil.restriccionesMedicas.map((r: RestriccionMedica) => (
              <div key={r.condicion} className={`restriccion-item severidad-${r.severidad}`}>
                <div className="restriccion-info">
                  <h4>{r.condicion}</h4>
                  <p>{r.recomendaciones || 'Sin recomendaciones específicas.'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: r.severidad === 'ALTA' ? '#FF4444' : '#888' }}>
                    NIVEL {r.severidad}
                  </span>
                  <button type="button" className="btn-icon" onClick={() => handleRemoveRestriccion(r.condicion)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form className="add-restriccion-form" onSubmit={handleAddedRestriccion}>
          <div className="perfil-grid">
            <div className="form-group">
              <label>Condición Médica / Lesión</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Asma, Lesión de rodilla"
                value={nuevaCondicion}
                onChange={(e) => setNuevaCondicion(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Peligrosidad</label>
              <select
                className="form-select"
                value={nuevaSeveridad}
                onChange={(e) => setNuevaSeveridad(e.target.value as any)}
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Cuidados Especiales (Opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Evitar impactos fuertes, usar inhalador"
              value={nuevasRecomendaciones}
              onChange={(e) => setNuevasRecomendaciones(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ marginTop: '16px' }}>
            + Registrar Condición
          </button>
        </form>
      </div>
    </div>
  );
};
