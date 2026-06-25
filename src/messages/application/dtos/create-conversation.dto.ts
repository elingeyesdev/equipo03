import { IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  targetUserId: number;
}
