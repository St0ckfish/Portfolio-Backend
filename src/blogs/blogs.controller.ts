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
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlogsService } from './blogs.service';
import { Blog } from '../schemas/blog.schema';
import { CreateBlogDto, UpdateBlogDto } from './dto';
import { ParseBlogIdPipe } from './pipes/parse-blog-id.pipe';

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
  async getAllBlogs(): Promise<Blog[]> {
    return this.blogsService.getAllBlogs();
  }

  @Get('/:id')
  async getBlogById(@Param('id', ParseBlogIdPipe) id: string): Promise<Blog> {
    return this.blogsService.getBlogById(id);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async updateBlog(
    @Param('id', ParseBlogIdPipe) id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @UploadedFile() image?: MulterFile,
    @Request() req?: { user?: { id?: string } },
  ): Promise<Blog> {
    const authorId = (req?.user?.id as string) || '';
    return this.blogsService.updateBlog(
      id,
      updateBlogDto.title,
      updateBlogDto.content,
      authorId,
      updateBlogDto.tags,
      image,
      updateBlogDto.category,
    );
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deleteBlog(@Param('id', ParseBlogIdPipe) id: string) {
    return this.blogsService.deleteBlog(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async createBlog(
    @Body() createBlogDto: CreateBlogDto,
    @UploadedFile() image?: MulterFile,
    @Request() req?: { user?: { id?: string } },
  ): Promise<Blog> {
    const authorId = (req?.user?.id as string) || '';
    return this.blogsService.createBlog(
      createBlogDto.title,
      createBlogDto.content,
      authorId,
      createBlogDto.tags,
      image,
      createBlogDto.category,
    );
  }
}
