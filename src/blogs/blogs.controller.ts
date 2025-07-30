import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogsService } from './blogs.service';
import { Blog } from './blog.model';

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

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  getAllBlogs(): Blog[] {
    return this.blogsService.getAllBlogs();
  }

  @Get('/:id')
  getBlogById(@Param('id') id: string): Blog | undefined {
    return this.blogsService.getBlogById(id);
  }

  @Patch('/:id')
  @UseInterceptors(FileInterceptor('image'))
  updateBlog(
    @Param('id') id: string,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('tags') tags?: string,
    @Body('category') category?: string,
    @UploadedFile() image?: MulterFile,
  ): Blog | undefined {
    const tagsArray = tags ? tags.split(',').map((tag) => tag.trim()) : [];
    return this.blogsService.updateBlog(
      id,
      title,
      content,
      tagsArray,
      image,
      category,
    );
  }

  @Delete('/:id')
  deleteBlog(@Param('id') id: string) {
    return this.blogsService.deleteBlog(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  createBlog(
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('tags') tags?: string,
    @Body('category') category?: string,
    @UploadedFile() image?: MulterFile,
  ): Blog {
    const tagsArray = tags ? tags.split(',').map((tag) => tag.trim()) : [];
    return this.blogsService.createBlog(
      title,
      content,
      tagsArray,
      image,
      category,
    );
  }
}
