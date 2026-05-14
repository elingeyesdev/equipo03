import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';

type RoutineDto = {
  id: number;
  name: string;
  difficulty: string;
  description: string;
};

const RoutineModal = ({ isOpen, onClose, routineToEdit, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '', difficulty: 'FACIL', description: ''
  });
  
  useEffect(() => {
    if (routineToEdit) {
      setFormData({
        name: routineToEdit.name || '',
        difficulty: routineToEdit.difficultyLevel || 'FACIL',
        description: routineToEdit.description || ''
      });
    } else {
      setFormData({ name: '', difficulty: 'FACIL', description: '' });
    }
  }, [routineToEdit, isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h2>{routineToEdit ? 'Editar Rutina' : 'Nueva Rutina'}</h2>
        </div>
        <div className="modal-form-group">
          <label>Nombre de la Rutina</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Hipertrofia Full Body" />
        </div>
        <div className="modal-form-group">
          <label>Dificultad</label>
          <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
            <option value="FACIL">Fácil</option>
            <option value="INTERMEDIO">Intermedio</option>
            <option value="AVANZADO">Avanzado</option>
          </select>
        </div>
        <div className="modal-form-group">
          <label>Descripción</label>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descripción general de la rutina..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid #3A3A3C', color: '#FFF' }} rows={4} />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(formData)}>Guardar Rutina</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export const RutinasView = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<RoutineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<RoutineDto | null>(null);
  const [deleteConfirmRoutine, setDeleteConfirmRoutine] = useState<RoutineDto | null>(null);

  const canDelete = user?.role === 'SUPER_ADMIN' || user?.role === 'GERENTE';

  useEffect(() => {
    let mounted = true;
    const fetchRoutines = async () => {
      try {
        setLoading(true);
        const resp = await apiClient.get('/routines');
        if (mounted) setRoutines(Array.isArray(resp.data) ? resp.data : []);
      } catch (err: any) {
        if (mounted) setError('No se pudieron cargar las rutinas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRoutines();
    return () => { mounted = false; };
  }, []);

  const handleDeleteRoutine = (r: RoutineDto) => setDeleteConfirmRoutine(r);
  
  const confirmDeleteRoutine = async () => {
    if (!deleteConfirmRoutine) return;
    try {
      await apiClient.delete(`/routines/${deleteConfirmRoutine.id}`);
      setRoutines(prev => prev.filter(r => r.id !== deleteConfirmRoutine.id));
    } catch (err) {
      // handled by api.config.ts
    } finally {
      setDeleteConfirmRoutine(null);
    }
  };

  const handleSaveRoutine = async (formData: any) => {
    try {
      let payload: any = {};
      
      if (routineToEdit) {
        payload = {
          name: formData.name,
          description: formData.description,
          difficultyLevel: formData.difficulty
        };
      } else {
        payload = {
          name: formData.name,
          description: formData.description,
          difficultyLevel: formData.difficulty,
          isTemplate: false,
          trainerId: Number(user?.userId) || 1
        };
      }
      
      console.log(`[Security Check]: Ejecutando acción para Rol ${user?.role} con Scope Gym ${user?.gymId || 'Global'}`);
      console.log(`[Final Contract]: Enviando payload a /routines -> ${JSON.stringify(payload)}`);

      if (routineToEdit) {
        await apiClient.put(`/routines/${routineToEdit.id}`, payload);
        setRoutines(prev => prev.map(r => r.id === routineToEdit.id ? { ...r, ...payload } : r));
      } else {
        const res = await apiClient.post('/routines', payload);
        const newRoutine = res.data?.id ? res.data : { id: res.data?.data?.id || Date.now(), ...payload };
        setRoutines(prev => [...prev, newRoutine]);
      }
      setIsModalOpen(false);
    } catch (err) {
      // Handled by api.config.ts
    }
  };

  return (
    <section style={panelStyle} className="glass-panel">
      <h1 style={{ marginTop: 0 }}>Rutinas de Entrenamiento</h1>
      <p>Gestión de planes de entrenamiento corporales.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando rutinas...' : `Total de rutinas: ${routines.length}`}
        </div>
        {user?.role !== 'CLIENTE' && (
          <button 
            onClick={() => { setRoutineToEdit(null); setIsModalOpen(true); }}
            style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Nueva Rutina
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Rutina</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Dificultad</th>
                <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Descripción</th>
                {user?.role !== 'CLIENTE' && (
                  <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#8E8E93' }}>Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {routines.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: r.difficulty === 'FACIL' ? 'rgba(48, 209, 88, 0.1)' : r.difficulty === 'INTERMEDIO' ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255, 94, 0, 0.1)',
                      color: r.difficulty === 'FACIL' ? '#30D158' : r.difficulty === 'INTERMEDIO' ? '#FF9F0A' : '#FF5E00' 
                    }}>
                      {r.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', color: '#E5E5EA' }}>{r.description || '-'}</td>
                  {user?.role !== 'CLIENTE' && (
                    <td style={{ padding: '0.6rem', borderBottom: '1px solid #3A3A3C', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => { setRoutineToEdit(r); setIsModalOpen(true); }} style={{ background: '#00D9FF', color: '#0A0A0A', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Editar</button>
                        {canDelete && (
                          <button onClick={() => handleDeleteRoutine(r)} style={{ background: 'rgba(255, 94, 0, 0.1)', color: '#FF5E00', border: '1px solid #FF5E00', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RoutineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        routineToEdit={routineToEdit} 
        onSave={handleSaveRoutine} 
      />

      <ConfirmModal
        isOpen={!!deleteConfirmRoutine}
        onClose={() => setDeleteConfirmRoutine(null)}
        onConfirm={confirmDeleteRoutine}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de querer eliminar la rutina "${deleteConfirmRoutine?.name}"? Esta acción no se puede deshacer.`}
      />
    </section>
  );
};


// ============================================================
// MÓDULO DE ROLES — Exclusivo SUPER_ADMIN
// ============================================================
