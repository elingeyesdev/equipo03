import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  type: string;

  @Column({ type: 'varchar', length: 255, name: 'title_template' })
  titleTemplate: string;

  @Column({ type: 'text', name: 'body_template' })
  bodyTemplate: string;
}
