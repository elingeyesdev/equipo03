import { Repository } from 'typeorm';
import { PhysicalMetricsHistory } from '../domain/physical-metrics-history.entity';
import { type RequestWithUser } from '../../common/security/gym-scope';
export declare class MetricsService {
    private repo;
    private readonly request;
    constructor(repo: Repository<PhysicalMetricsHistory>, request: RequestWithUser);
    private managerGymId;
    create(data: Partial<PhysicalMetricsHistory>): Promise<PhysicalMetricsHistory>;
    findAll(): Promise<PhysicalMetricsHistory[]>;
    findByUser(userId: number): Promise<PhysicalMetricsHistory[]>;
    findLatest(userId: number): Promise<PhysicalMetricsHistory>;
    findOne(id: number): Promise<PhysicalMetricsHistory>;
    remove(id: number): Promise<void>;
}
