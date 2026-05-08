export type NotificationType = 'SECURITY_ALERT' | 'INFO' | 'WARNING';

export interface NotificationProps {
  id?: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead?: boolean;
  createdAt?: Date;
}

export class Notification {
  private props: NotificationProps;

  constructor(props: NotificationProps) {
    this.props = {
      ...props,
      isRead: props.isRead ?? false,
      createdAt: props.createdAt || new Date(),
    };
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get message(): string {
    return this.props.message;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get isRead(): boolean {
    return this.props.isRead!;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }
}
