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

  @Column({ type: 'varchar', length: 500, name: 'video_url', nullable: true })
  videoUrl!: string;

  @Column({ type: 'varchar', length: 500, name: 'image_url', nullable: true })
  imageUrl!: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'updated_at', nullable: true })
  updatedAt!: Date;
}
