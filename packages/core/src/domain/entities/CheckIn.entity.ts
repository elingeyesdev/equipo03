export type CheckInStatus = 'AUTORIZADO' | 'DENEGADO';
export type AccessMethod = 'QR' | 'NFC' | 'MANUAL';

export interface CheckInProps {
  id?: number;
  userId: number;
  gymId: number;
  status: CheckInStatus;
  method: AccessMethod;
  checkInTime: Date;
}

export class CheckIn {
  private props: CheckInProps;

  constructor(props: CheckInProps) {
    this.props = {
      ...props,
      checkInTime: props.checkInTime || new Date(),
    };
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get userId(): number {
    return this.props.userId;
  }

  get gymId(): number {
    return this.props.gymId;
  }

  get status(): CheckInStatus {
    return this.props.status;
  }

  get method(): AccessMethod {
    return this.props.method;
  }

  get checkInTime(): Date {
    return this.props.checkInTime;
  }

  public toJSON() {
    return { ...this.props };
  }
}
