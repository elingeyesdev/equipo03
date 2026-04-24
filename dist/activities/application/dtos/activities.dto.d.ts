export declare class CreateActivityDto {
    gymId: number;
    name: string;
    description?: string;
    defaultDurationMin?: number;
}
export declare class CreateActivityScheduleDto {
    instructorId?: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    maxAttendees: number;
    isRecurring?: boolean;
}
export declare class RegisterAttendanceDto {
    userId: number;
    status?: string;
}
