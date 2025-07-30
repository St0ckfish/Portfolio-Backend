import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UseInterceptors(FileInterceptor('image'))
  async signUp(
    @Body() signUpDto: SignUpDto,
    @UploadedFile() image?: MulterFile,
  ) {
    return this.authService.signUp(signUpDto, image);
  }

  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req: { user: { id: string } }): Promise<any> {
    return this.authService.getCurrentUser(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async updateUser(
    @Request() req: { user: { id: string } },
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() image?: MulterFile,
  ): Promise<any> {
    return this.authService.updateUser(req.user.id, updateUserDto, image);
  }
}
