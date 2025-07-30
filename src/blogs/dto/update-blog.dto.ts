import {
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBlogDto {
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @IsString({ message: 'Content must be a string' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  content: string;

  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      );
    }
    return [];
  })
  tags?: string[];

  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @MaxLength(50, { message: 'Category must not exceed 50 characters' })
  category?: string;
}
