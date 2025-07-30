import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlogDocument = Blog & Document;

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, trim: true })
  author: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId: Types.ObjectId;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ trim: true })
  category?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// Add indexes for better query performance
BlogSchema.index({ createdAt: -1 });
BlogSchema.index({ authorId: 1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ tags: 1 });
