import { Repository } from 'typeorm';
import { PhysicalMetricsHistory } from '../domain/physical-metrics-history.entity';
export declare class MetricsService {
    private repo;
    constructor(repo: Repository<PhysicalMetricsHistory>);
    create(data: Partial<PhysicalMetricsHistory>): Promise<PhysicalMetricsHistory>;
    findAll(): Promise<PhysicalMetricsHistory[]>;
    findByUser(userId: number): Promise<PhysicalMetricsHistory[]>;
    findLatest(userId: number): Promise<PhysicalMetricsHistory>;
    findOne(id: number): Promise<PhysicalMetricsHistory>;
    remove(id: number): Promise<void>;
}
