import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { GymActivityListItem, GymActivityScheduleDto } from '../../../infrastructure/activities.types';
import { activitiesApi } from '../../../infrastructure/AxiosActivitiesApi.adapter';
import { CreateScheduleModal } from './CreateScheduleModal';
import type { InstructorOption } from './activities.types';
import './ActivitiesForms.css';

export type ActivityDetailViewProps = {
  activity: GymActivityListItem;
  instructors: InstructorOption[];
  onRefreshActivities?: () => void;
};

export function ActivityDetailView({ activity, instructors, onRefreshActivities }: ActivityDetailViewProps) {
  const [schedules, setSchedules] = useState<GymActivityScheduleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const list = await activitiesApi.getActivitySchedules(activity.id);
      setSchedules(list);
    } catch {
      toast.error('No se pudieron cargar los horarios de esta actividad.');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [activity.id]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleScheduleCreated = () => {
    loadSchedules();
    onRefreshActivities?.();
  };

  return (
    <div className="activity-detail-view glass-panel">
      <div className="activity-detail-header">
        <div>
          <h3 className="activity-detail-title">{activity.name}</h3>
          {activity.description ? <p className="activity-detail-desc">{activity.description}</p> : null}
        </div>
        <button type="button" className="btn-primary activities-add-btn" onClick={() => setModalOpen(true)}>
          + Añadir horario
        </button>
      </div>

      <div className="activity-schedules-wrap">
        <h4 className="activity-schedules-heading">Horarios programados</h4>
        {loading ? (
          <p className="activity-schedules-muted">Cargando…</p>
        ) : schedules.length === 0 ? (
          <p className="activity-schedules-muted">Aún no hay horarios. Pulsa &quot;Añadir horario&quot; para crear uno.</p>
        ) : (
          <ul className="activity-schedules-list">
            {schedules.map((s) => (
              <li key={s.id} className="activity-schedule-row">
                <span className="activity-schedule-day">{s.dayOfWeek}</span>
                <span className="activity-schedule-time">
                  {String(s.startTime).substring(0, 5)} – {String(s.endTime).substring(0, 5)}
                </span>
                <span className="activity-schedule-meta">Instructor #{s.instructorId}</span>
                <span className="activity-schedule-meta">Cupos: {s.maxAttendees}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateScheduleModal
        isOpen={modalOpen}
        activityId={activity.id}
        activityName={activity.name}
        instructors={instructors}
        onClose={() => setModalOpen(false)}
        onSuccess={handleScheduleCreated}
      />
    </div>
  );
}
