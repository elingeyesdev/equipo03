export declare class CreateTrainingGoalsDto {
    primaryGoal: string;
    experienceLevel: string;
}
export declare class CreateTrainingPreferencesDto {
    preferredTrainingTypes?: string[];
    priorityBodyAreas?: string[];
    availableDaysPerWeek?: number;
}
export declare class CreateTrainingProfileDto {
    userId: number;
    goals?: CreateTrainingGoalsDto;
    preferences?: CreateTrainingPreferencesDto;
}
export declare class CreateRestrictionDto {
    userId: number;
    restrictionType: string;
    description?: string;
    affectedBodyAreas?: string[];
    movementsToAvoid?: string[];
    requiresTrainerApproval?: boolean;
}
export declare class CreateEmergencyContactDto {
    userId: number;
    fullName: string;
    phone: string;
    relation: string;
    isPrimary?: boolean;
}
export declare class CreateSessionDto {
    routineId: number;
    userId: number;
    gymId: number;
    notes?: string;
}
export declare class UpdateSessionDto {
    status?: string;
    totalDurationMinutes?: number;
    notes?: string;
}
export declare class AddSetDto {
    routineExerciseId: number;
    setNumber: number;
    repsCompleted: number;
    weightUsedKg?: number;
    restTakenSeconds?: number;
    ratingPerceivedExertion?: number;
}
