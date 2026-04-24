export declare class CreateGymLocationDto {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
}
export declare class CreateGymScheduleDto {
    dayOfWeek: string;
    opensAt: string;
    closesAt: string;
    isHoliday?: boolean;
}
export declare class CreateGymDto {
    name: string;
    description?: string;
    maxCapacity: number;
    location?: CreateGymLocationDto;
    schedules?: CreateGymScheduleDto[];
}
export declare class UpdateGymDto {
    name?: string;
    description?: string;
    maxCapacity?: number;
    isOpen?: boolean;
}
export declare class CreateGymScheduleInputDto {
    dayOfWeek: string;
    opensAt: string;
    closesAt: string;
    isHoliday?: boolean;
}
export declare class UpdateGymLocationDto {
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
}
