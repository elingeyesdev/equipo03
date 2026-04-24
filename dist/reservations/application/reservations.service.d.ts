import { Repository } from 'typeorm';
import { Reservation } from '../domain/reservation.entity';
export declare class ReservationsService {
    private repo;
    constructor(repo: Repository<Reservation>);
    create(data: any): Promise<Reservation[]>;
    findAll(): Promise<Reservation[]>;
    findByUser(userId: number): Promise<Reservation[]>;
    findOne(id: number): Promise<Reservation>;
    cancel(id: number): Promise<Reservation>;
}
