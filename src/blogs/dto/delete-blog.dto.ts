import { IsString } from 'class-validator';

export class DeleteBlogDto {
  @IsString({ message: 'ID must be a string' })
  id: string;
}
