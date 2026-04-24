import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_monthly' })
  priceMonthly: number;

  @Column({ type: 'integer', name: 'max_gyms_access', nullable: true })
  maxGymsAccess: number;

  @Column({ type: 'jsonb', nullable: true })
  features: any;
}
