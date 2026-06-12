import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Entity('nutritional_appointments')
export class NutritionalAppointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'nutritionist_id' })
  nutritionistId!: number;

  @Column({ type: 'integer', name: 'patient_id' })
  patientId!: number;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime!: string;

  /** CONSULTA | SEGUIMIENTO | EVALUACION | PLAN_DIETA */
  @Column({
    type: 'varchar',
    length: 100,
    name: 'appointment_type',
    default: 'CONSULTA',
  })
  appointmentType!: string;

  /** PENDIENTE | COMPLETADA | CANCELADA */
  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // ── Relations ─────────────────────────────────────
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nutritionist_id' })
  nutritionist!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient!: User;
}
