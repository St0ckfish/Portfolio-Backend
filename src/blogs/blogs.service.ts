import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument } from '../schemas/blog.schema';
import { User, UserDocument } from '../schemas/user.schema';
import * as fs from 'fs';
import * as path from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getAllBlogs(): Promise<Blog[]> {
    return this.blogModel
      .find()
      .populate('authorId', 'name username imageUrl')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getBlogById(id: string): Promise<Blog> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid blog ID format');
    }

    const blog = await this.blogModel
      .findById(id)
      .populate('authorId', 'name username imageUrl')
      .exec();

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    return blog;
  }

  async deleteBlog(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid blog ID format');
    }

    const blog = await this.blogModel.findById(id).exec();
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    // Clean up image file if it exists
    if (blog.imageUrl) {
      const imagePath = path.join(process.cwd(), blog.imageUrl);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (error) {
          console.warn(`Failed to delete image file: ${imagePath}`, error);
        }
      }
    }

    await this.blogModel.findByIdAndDelete(id).exec();

    return {
      deleted: true,
      id,
      message: `Blog with ID ${id} has been successfully deleted`,
    };
  }

  async updateBlog(
    id: string,
    title: string,
    content: string,
    authorId: string,
    tags?: string[],
    imageFile?: MulterFile,
    category?: string,
  ): Promise<Blog> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid blog ID format');
    }

    // Validate input
    if (!title?.trim()) {
      throw new BadRequestException('Title is required and cannot be empty');
    }
    if (!content?.trim()) {
      throw new BadRequestException('Content is required and cannot be empty');
    }

    const blog = await this.blogModel.findById(id).exec();
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    // Handle image upload if provided
    if (imageFile) {
      // Remove old image if it exists
      if (blog.imageUrl) {
        const oldImagePath = path.join(process.cwd(), blog.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (error) {
            console.warn(`Failed to delete old image: ${oldImagePath}`, error);
          }
        }
      }

      const uploadsDir = path.join(process.cwd(), 'uploads', 'blog-images');
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      // Generate unique filename
      const fileExtension = path.extname(imageFile.originalname);
      const fileName = `blog-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);
      // Save file
      fs.writeFileSync(filePath, imageFile.buffer);
      // Update image URL
      blog.imageUrl = `/uploads/blog-images/${fileName}`;
    }

    // Update blog fields
    const updateData = {
      title: title.trim(),
      content: content.trim(),
      tags: tags || [],
      category: category?.trim(),
      authorId: new Types.ObjectId(authorId),
    };

    if (imageFile) {
      updateData['imageUrl'] = blog.imageUrl;
    }

    const updatedBlog = await this.blogModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('authorId', 'name username imageUrl')
      .exec();

    return updatedBlog!;
  }

  async createBlog(
    title: string,
    content: string,
    authorId: string,
    tags?: string[],
    imageFile?: MulterFile,
    category?: string,
  ): Promise<Blog> {
    // Validate input
    if (!title?.trim()) {
      throw new BadRequestException('Title is required and cannot be empty');
    }
    if (!content?.trim()) {
      throw new BadRequestException('Content is required and cannot be empty');
    }

    let imageUrl: string | undefined;

    // Handle image upload if provided
    if (imageFile) {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'blog-images');
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      // Generate unique filename
      const fileExtension = path.extname(imageFile.originalname);
      const fileName = `blog-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);
      // Save file
      fs.writeFileSync(filePath, imageFile.buffer);
      // Generate URL
      imageUrl = `/uploads/blog-images/${fileName}`;
    }

    // Get user info for author field
    const user = await this.userModel.findById(authorId).exec();
    if (!user) {
      throw new BadRequestException('Invalid author ID');
    }

    const newBlog = new this.blogModel({
      title: title.trim(),
      content: content.trim(),
      author: user.name || user.username || 'Unknown',
      authorId: new Types.ObjectId(authorId),
      imageUrl,
      tags: tags || [],
      views: 0,
      likes: 0,
      category: category?.trim(),
    });

    const savedBlog = await newBlog.save();
    return (await this.blogModel
      .findById(savedBlog._id)
      .populate('authorId', 'name username imageUrl')
      .exec()) as Blog;
  }
}
