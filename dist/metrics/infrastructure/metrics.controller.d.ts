import { MetricsService } from '../application/metrics.service';
import { CreateMetricDto } from '../application/dtos/metrics.dto';
export declare class MetricsController {
    private readonly svc;
    constructor(svc: MetricsService);
    create(body: CreateMetricDto): Promise<import("../domain/physical-metrics-history.entity").PhysicalMetricsHistory>;
    findAll(): Promise<import("../domain/physical-metrics-history.entity").PhysicalMetricsHistory[]>;
    findByUser(uid: number): Promise<import("../domain/physical-metrics-history.entity").PhysicalMetricsHistory[]>;
    findLatest(uid: number): Promise<import("../domain/physical-metrics-history.entity").PhysicalMetricsHistory>;
    findOne(id: number): Promise<import("../domain/physical-metrics-history.entity").PhysicalMetricsHistory>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
