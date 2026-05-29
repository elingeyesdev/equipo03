import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ModalOverlay, ConfirmModal, panelStyle, RecordDetailModal, DetailField } from './Shared/DashboardShared';
import type { GymDto, GymScheduleDto, UserDto, CheckinDto, ScheduleEntry } from './Shared/DashboardTypes';
import { Eye, Edit, Trash2 } from 'lucide-react';

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

  const inputCls = "w-full bg-slate-50 dark:bg-[#151521] border border-slate-200 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2ecc71] transition-colors";
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 mt-3";

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        {routineToEdit ? 'Editar Rutina' : 'Nueva Rutina'}
      </h2>
      <label className={labelCls}>Nombre de la Rutina</label>
      <input type="text" className={inputCls} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Hipertrofia Full Body" />
      <label className={labelCls}>Dificultad</label>
      <select className={inputCls} value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
        <option value="FACIL">Fácil</option>
        <option value="INTERMEDIO">Intermedio</option>
        <option value="AVANZADO">Avanzado</option>
      </select>
      <label className={labelCls}>Descripción</label>
      <textarea className={inputCls} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descripción general de la rutina..." rows={4} />
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-gray-800">
        <button className="px-4 py-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors font-medium border-0 cursor-pointer bg-transparent" onClick={onClose}>Cancelar</button>
        <button className="px-4 py-2 bg-[#009ef7] hover:bg-[#0086d1] text-white font-medium rounded-lg shadow-sm transition-colors border-0 cursor-pointer" onClick={() => onSave(formData)}>Guardar Rutina</button>
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
  const [viewingRoutine, setViewingRoutine] = useState<RoutineDto | null>(null);

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
          trainerId: Number(user?.id) || 1
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rutinas de Entrenamiento</h1>
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Gestión de planes de entrenamiento corporales.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ color: '#8E8E93', fontSize: '0.9rem' }}>
          {loading ? 'Cargando rutinas...' : `Total de rutinas: ${routines.length}`}
        </div>
        {user?.role !== 'CLIENTE' && (
          <button
            onClick={() => { setRoutineToEdit(null); setIsModalOpen(true); }}
            style={{ background: '#5e72e4', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Nueva Rutina
          </button>
        )}
      </div>

      {error && <div style={{ marginTop: '0.75rem', color: '#FF5E00' }}>{error}</div>}

      {!loading && !error && (
        <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-x-auto mt-4 transition-colors">
          <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
            <thead className="bg-slate-50 dark:bg-[#151521] border-b border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>Rutina</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>Dificultad</th>
                <th style={{ textAlign: 'left', padding: '0.85rem 1rem' }}>Descripción</th>
                <th style={{ textAlign: 'center', padding: '0.85rem 1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {routines.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-gray-300 text-sm">
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: r.difficulty === 'FACIL' ? '#2dce89' : r.difficulty === 'INTERMEDIO' ? '#fb6340' : '#f5365c',
                      color: '#fff',
                    }}>
                      {r.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>{r.description || '-'}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <button onClick={() => setViewingRoutine(r)} style={{ background: '#11cdef', border: 'none', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} title="Ver ficha de rutina"><Eye size={13} />Detalle</button>
                      {user?.role !== 'CLIENTE' && (
                        <>
                          <button onClick={() => { setRoutineToEdit(r); setIsModalOpen(true); }} style={{ background: '#5e72e4', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Edit size={13} />Editar</button>
                          {canDelete && (
                            <button onClick={() => handleDeleteRoutine(r)} style={{ background: '#f5365c', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Trash2 size={13} />Eliminar</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
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

      <RecordDetailModal
        isOpen={!!viewingRoutine}
        onClose={() => setViewingRoutine(null)}
        title="Detalle del Plan de Entrenamiento"
      >
        <DetailField label="ID de Rutina" value={viewingRoutine?.id} />
        <DetailField label="Nombre de la Rutina" value={viewingRoutine?.name} />
        <DetailField 
          label="Nivel de Dificultad" 
          value={
            <span style={{ 
              padding: '0.2rem 0.5rem', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              fontWeight: 700,
              background: viewingRoutine?.difficulty === 'FACIL' ? '#2dce89' : viewingRoutine?.difficulty === 'INTERMEDIO' ? '#fb6340' : '#f5365c',
              color: '#fff'
            }}>
              {viewingRoutine?.difficulty}
            </span>
          } 
        />
        <DetailField 
          label="Tipo de Plantilla" 
          value={(viewingRoutine as any)?.isTemplate ? 'Plantilla Global' : 'Plan Personalizado'} 
        />
        <DetailField 
          label="Descripción Completa" 
          isFullWidth 
          value={
            <div style={{ whiteSpace: 'pre-wrap', color: '#E5E5EA', lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
              {viewingRoutine?.description || 'Sin descripción proporcionada para esta rutina.'}
            </div>
          } 
        />
      </RecordDetailModal>
    </section>
  );
};


// ============================================================
// MÓDULO DE ROLES — Exclusivo SUPER_ADMIN
// ============================================================