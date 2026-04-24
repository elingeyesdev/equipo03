import { TrainingService } from '../application/training.service';
import { CreateTrainingProfileDto, CreateRestrictionDto, CreateEmergencyContactDto, CreateSessionDto, UpdateSessionDto, AddSetDto } from '../application/dtos/training.dto';
export declare class TrainingController {
    private readonly svc;
    constructor(svc: TrainingService);
    createProfile(body: CreateTrainingProfileDto): Promise<import("../domain/user-training.entity").UserTraining>;
    getProfile(uid: number): Promise<import("../domain/user-training.entity").UserTraining>;
    createRestriction(body: CreateRestrictionDto): Promise<import("../domain/user-training-restriction.entity").UserTrainingRestriction>;
    findRestriction(uid: number): Promise<import("../domain/user-training-restriction.entity").UserTrainingRestriction | null>;
    createEC(body: CreateEmergencyContactDto): Promise<import("../domain/emergency-contact.entity").EmergencyContact>;
    findECs(uid: number): Promise<import("../domain/emergency-contact.entity").EmergencyContact[]>;
    removeEC(id: number): Promise<import("typeorm").DeleteResult>;
    createSession(body: CreateSessionDto): Promise<import("../domain/workout-session.entity").WorkoutSession>;
    findSessions(): Promise<import("../domain/workout-session.entity").WorkoutSession[]>;
    findByUser(uid: number): Promise<import("../domain/workout-session.entity").WorkoutSession[]>;
    findOneSession(id: number): Promise<import("../domain/workout-session.entity").WorkoutSession>;
    updateSession(id: number, body: UpdateSessionDto): Promise<import("../domain/workout-session.entity").WorkoutSession>;
    addSet(id: number, body: AddSetDto): Promise<import("../domain/workout-set.entity").WorkoutSet[]>;
}
