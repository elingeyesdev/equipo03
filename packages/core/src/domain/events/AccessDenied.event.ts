export class AccessDeniedDomainEvent {
  constructor(
    public readonly gymId: number,
    public readonly gymName: string,
    public readonly attemptedUserId: number,
    public readonly reason: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
