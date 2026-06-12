import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTraining } from './domain/user-training.entity';
import { UserTrainingGoals } from './domain/user-training-goals.entity';
import { UserTrainingPreferences } from './domain/user-training-preferences.entity';
import { UserTrainingRestriction } from './domain/user-training-restriction.entity';
import { EmergencyContact } from './domain/emergency-contact.entity';
import { WorkoutSession } from './domain/workout-session.entity';
import { WorkoutSet } from './domain/workout-set.entity';
import { UserSubscription } from '../subscriptions/domain/user-subscription.entity';
import { TrainingService } from './application/training.service';
import { TrainingController } from './infrastructure/training.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserTraining,
      UserTrainingGoals,
      UserTrainingPreferences,
      UserTrainingRestriction,
      EmergencyContact,
      WorkoutSession,
      WorkoutSet,
      UserSubscription,
    ]),
  ],
  controllers: [TrainingController],
  providers: [TrainingService],
  exports: [TrainingService],
})
export class TrainingModule {}
