import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('exercise_catalog')
export class ExerciseCatalog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 50, name: 'muscle_group' })
  muscleGroup!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category!: string | null;

  @Column({ type: 'varchar', length: 30, name: 'exercise_type', nullable: true })
  exerciseType!: string | null;

  @Column({ type: 'jsonb', name: 'secondary_muscle_groups', nullable: true })
  secondaryMuscleGroups!: string[];

  @Column({
    type: 'varchar',
    length: 100,
    name: 'equipment_required',
    nullable: true,
  })
  equipmentRequired!: string;

  @Column({ type: 'varchar', length: 30, name: 'difficulty_level' })
  difficultyLevel!: string;

  @Column({ type: 'varchar', length: 20, name: 'youtube_video_id', nullable: true })
  youtubeVideoId!: string | null;

  @Column({ type: 'varchar', length: 500, name: 'image_url', nullable: true })
  imageUrl!: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({
    type: 'enum',
    enum: ['WEIGHT_REPS', 'REPS_ONLY', 'TIME_DISTANCE', 'TIME_ONLY'],
    default: 'WEIGHT_REPS', // Valor por defecto para datos antiguos
    comment: 'Define el tipo de parámetros a registrar por serie para este ejercicio.'
  })
  logType!: 'WEIGHT_REPS' | 'REPS_ONLY' | 'TIME_DISTANCE' | 'TIME_ONLY';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'updated_at', nullable: true })
  updatedAt!: Date;
}
