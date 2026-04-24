export declare class RoutineExerciseItemDto {
    exerciseId: number;
    orderPosition: number;
    setsRecommended: number;
    repsRecommended: string;
    weightRecommendedKg?: number;
    restSecondsBetweenSets?: number;
    notes?: string;
}
export declare class CreateRoutineDto {
    name: string;
    description?: string;
    trainerId: number;
    assignedUserId?: number;
    gymId?: number;
    difficultyLevel: string;
    durationWeeks?: number;
    isTemplate?: boolean;
    exercises?: RoutineExerciseItemDto[];
}
export declare class UpdateRoutineDto {
    name?: string;
    description?: string;
    difficultyLevel?: string;
    isActive?: boolean;
    exercises?: RoutineExerciseItemDto[];
}
