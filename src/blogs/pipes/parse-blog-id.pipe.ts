import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseBlogIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new BadRequestException('Blog ID is required');
    }

    // Check if it's a valid MongoDB ObjectId
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid blog ID format');
    }

    return value;
  }
}
