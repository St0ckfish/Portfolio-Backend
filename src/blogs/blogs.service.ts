import { Injectable } from '@nestjs/common';
import { Blog } from './blog.model';
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
  private blogs: Blog[] = [];

  getAllBlogs(): Blog[] {
    return this.blogs.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  getBlogById(id: string): Blog | undefined {
    return this.blogs.find((blog) => blog.id.toString() === id);
  }

  deleteBlog(id: string) {
    this.blogs = this.blogs.filter((blog) => blog.id.toString() !== id);
    return {
      deleted: true,
      id,
    };
  }

  updateBlog(
    id: string,
    title: string,
    content: string,
    tags?: string[],
    imageFile?: MulterFile,
    category?: string,
  ): Blog | undefined {
    const blog = this.getBlogById(id);
    if (!blog) return undefined;

    blog.title = title;
    blog.content = content;
    blog.tags = tags || [];
    blog.category = category;

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
      blog.imageUrl = `/uploads/blog-images/${fileName}`;
    }

    return blog;
  }

  createBlog(
    title: string,
    content: string,
    tags?: string[],
    imageFile?: MulterFile,
    category?: string,
  ): Blog {
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

    const newBlog: Blog = {
      id: this.blogs.length + 1,
      title,
      content,
      author: 'Mostapha Taha (Stockfish)',
      imageUrl,
      createdAt: new Date(),
      tags,
      views: 0,
      likes: 0,
      category,
    };

    this.blogs.push(newBlog);
    return newBlog;
  }
}
