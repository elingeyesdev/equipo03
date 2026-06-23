import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Gym } from './gym.entity';

export enum MachineStatus {
  AVAILABLE = 'AVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum MachineCategory {
  CARDIO = 'CARDIO',
  TREN_SUPERIOR = 'TREN_SUPERIOR',
  TREN_INFERIOR = 'TREN_INFERIOR',
  ESPALDA = 'ESPALDA',
  MULTIESTACION = 'MULTIESTACION',
}

@Index('idx_machine_inventory_gym_status', ['gymId', 'status'])
@Entity('machine_inventory')
export class MachineInventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_machine_inventory_gym_id')
  @Column({ type: 'integer', name: 'gym_id' })
  gymId!: number;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index('idx_machine_inventory_status')
  @Column({
    type: 'enum',
    enum: MachineStatus,
    default: MachineStatus.AVAILABLE,
  })
  status!: MachineStatus;

  @Index('idx_machine_inventory_category')
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
