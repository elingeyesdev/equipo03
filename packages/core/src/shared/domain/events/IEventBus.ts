export interface IEventBus {
  publish(event: any): Promise<void>;
}

export const IEventBus = Symbol('IEventBus');
