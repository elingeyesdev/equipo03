import { IsInt, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  conversationId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
