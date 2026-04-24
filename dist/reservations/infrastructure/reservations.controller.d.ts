import { ReservationsService } from '../application/reservations.service';
import { CreateReservationDto } from '../application/dtos/reservations.dto';
export declare class ReservationsController {
    private readonly svc;
    constructor(svc: ReservationsService);
    create(body: CreateReservationDto): Promise<import("../domain/reservation.entity").Reservation[]>;
    findAll(): Promise<import("../domain/reservation.entity").Reservation[]>;
    findByUser(uid: number): Promise<import("../domain/reservation.entity").Reservation[]>;
    findOne(id: number): Promise<import("../domain/reservation.entity").Reservation>;
    cancel(id: number): Promise<import("../domain/reservation.entity").Reservation>;
}
