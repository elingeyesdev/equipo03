import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gym } from './gym.entity';

export enum MachineStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum MachineCategory {
  CARDIO = 'CARDIO',
  TREN_SUPERIOR = 'TREN_SUPERIOR',
  TREN_INFERIOR = 'TREN_INFERIOR',
  ESPALDA = 'ESPALDA',
  MULTIESTACION = 'MULTIESTACION',
}

@Entity('machine_inventory')
export class MachineInventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'integer', name: 'gym_id' })
  gymId!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({
    type: 'enum',
    enum: MachineStatus,
    default: MachineStatus.AVAILABLE,
  })
  status!: MachineStatus;

  @Column({
    type: 'enum',
    enum: MachineCategory,
    default: MachineCategory.MULTIESTACION,
  })
  category!: MachineCategory;

  @Column({ type: 'varchar', length: 500, name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Gym, (gym) => gym.machines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gym_id' })
  gym!: Gym;
}
