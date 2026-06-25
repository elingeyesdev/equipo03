import { IsIn, IsString } from 'class-validator';

export class DeleteMessageDto {
  @IsString()
  @IsIn(['FOR_ME', 'FOR_ALL'])
  type: 'FOR_ME' | 'FOR_ALL';
}
