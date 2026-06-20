import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Image as ImageIcon, Dumbbell, Filter, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../infrastructure/api.config';
import { ExerciseFormModal } from '../../components/Dashboard/ExerciseFormModal';

type Exercise = {
  id: number;
  name: string;
  description?: string;
  muscleGroup?: string;
  category?: string;
  exerciseType?: string;
  difficultyLevel?: string;
  equipmentRequired?: string;
  youtubeVideoId?: string;
  imageUrl?: string;
};

export const ExerciseCatalogScreen = () => {
  const { user } = useAuth();
  const isSuperAdmin = (user?.level ?? 0) >= 10;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [modalExercise, setModalExercise] = useState<Exercise | null | 'new'>(null);

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/exercises');
      setExercises(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('No se pudo cargar el catálogo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ex.equipmentRequired || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscleGroup
        ? ex.muscleGroup === selectedMuscleGroup
        : true;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, selectedMuscleGroup]);

  const muscleGroups = useMemo(() => {
    const groups = exercises.map(ex => ex.muscleGroup).filter(Boolean);
    return Array.from(new Set(groups)).sort();
  }, [exercises]);

  const closeModal = useCallback(() => {
    setModalExercise(null);
    fetchExercises();
  }, [fetchExercises]);

  if ((user?.level ?? 0) < 4) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No tienes permisos para acceder al Catálogo de Máquinas.
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#1a1a1a] min-h-full">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Catálogo de Ejercicios y Equipamiento</h1>
          {isSuperAdmin && (
            <button
              onClick={() => setModalExercise('new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Nuevo Ejercicio
            </button>
          )}
        </div>
        <p className="text-gray-400 text-sm mb-6">{exercises.length} registros totales.</p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o máquina..."
              className="w-full bg-[#242424] text-white border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <select
              className="w-full bg-[#242424] text-white border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
              value={selectedMuscleGroup}
              onChange={(e) => setSelectedMuscleGroup(e.target.value)}
            >
              <option value="">Todos los grupos musculares</option>
              {muscleGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-blue-500">
          <Dumbbell className="animate-spin" size={32} />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-16 bg-[#242424] border border-gray-700 rounded-xl">
          <ImageIcon className="mx-auto text-gray-600 mb-3" size={48} />
          <p className="text-gray-400 font-medium">No se encontraron ejercicios con esos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map(exercise => (
            <div key={exercise.id} className="bg-[#242424] border border-gray-800 hover:border-gray-600 transition-colors rounded-xl overflow-hidden flex flex-col h-[340px] shadow-lg">
              <div className="h-[160px] w-full shrink-0 relative bg-[#111111]">
                {exercise.imageUrl ? (
                  <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-4 text-center">
                    <Dumbbell className="text-gray-700 mb-2" size={32} />
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Sin Foto Real</span>
                    <p className="text-gray-600 text-xs mt-2 truncate w-full">Eq: {exercise.equipmentRequired || 'Ninguno'}</p>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider text-white border border-white/10 uppercase">
                  {exercise.difficultyLevel || 'N/A'}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-white font-bold text-base truncate mb-1" title={exercise.name}>{exercise.name}</h3>
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">{exercise.muscleGroup || 'General'}</p>
                <p className="text-gray-500 text-xs line-clamp-2 mb-auto">
                  Equipamiento: <span className="text-gray-300">{exercise.equipmentRequired || 'Peso corporal'}</span>
                </p>
                {isSuperAdmin && (
                  <button
                    onClick={() => setModalExercise(exercise)}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-blue-600 text-gray-300 hover:text-white border border-gray-700 hover:border-blue-500 py-2.5 rounded-lg text-sm font-medium transition-all"
                  >
                    <ImageIcon size={16} /> Gestionar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalExercise !== null && (
        <ExerciseFormModal
          exercise={modalExercise === 'new' ? null : modalExercise}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}
    </div>
  );
};
