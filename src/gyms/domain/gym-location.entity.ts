import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Gym } from './gym.entity';

@Unique(['latitude', 'longitude'])
@Entity('gym_location')
export class GymLocation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'gym_id', unique: true })
  gymId!: number;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude!: number;

  // ── Relations ─────────────────────────────────────
  @OneToOne(() => Gym, (g) => g.location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym;
}
