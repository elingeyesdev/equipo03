export declare class CreateExerciseDto {
    name: string;
    description?: string;
    muscleGroup: string;
    secondaryMuscleGroups?: string[];
    equipmentRequired?: string;
    difficultyLevel: string;
    videoUrl?: string;
    imageUrl?: string;
}
export declare class UpdateExerciseDto {
    name?: string;
    description?: string;
    muscleGroup?: string;
    difficultyLevel?: string;
    isActive?: boolean;
}
