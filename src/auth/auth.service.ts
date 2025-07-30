import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserDocument } from '../schemas/user.schema';
import { SignUpDto, SignInDto, UpdateUserDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

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
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signUp(
    signUpDto: SignUpDto,
    imageFile?: MulterFile,
  ): Promise<{ token: string; user: any }> {
    const { name, username, password } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ username }).exec();
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Validate password strength
    if (password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let imageUrl: string | undefined;

    // Handle image upload if provided
    if (imageFile) {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'user-images');
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      // Generate unique filename
      const fileExtension = path.extname(imageFile.originalname);
      const fileName = `user-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);
      // Save file
      fs.writeFileSync(filePath, imageFile.buffer);
      // Generate URL
      imageUrl = `/uploads/user-images/${fileName}`;
    }

    // Create user
    const user = new this.userModel({
      name,
      username,
      password: hashedPassword,
      imageUrl,
    });

    const savedUser = await user.save();

    // Generate JWT token
    const payload: JwtPayload = {
      sub: String(savedUser._id),
      username: savedUser.username,
      name: savedUser.name,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        username: savedUser.username,
        imageUrl: savedUser.imageUrl,
        createdAt: savedUser.createdAt,
      },
    };
  }

  async signIn(signInDto: SignInDto): Promise<{ token: string; user: any }> {
    const { username, password } = signInDto;

    // Find user
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: String(user._id),
      username: user.username,
      name: user.name,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
      },
    };
  }

  async getAllUsers(): Promise<any[]> {
    const users = await this.userModel
      .find({}, { password: 0 }) // Exclude password field
      .sort({ createdAt: -1 })
      .exec();

    return users.map((user) => ({
      id: user._id,
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId, { password: 0 }).exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user._id,
      name: user.name,
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    imageFile?: MulterFile,
  ): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if username is being updated and if it's already taken
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userModel
        .findOne({ username: updateUserDto.username })
        .exec();
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    const updateData: Partial<{
      name: string;
      username: string;
      password: string;
      imageUrl: string;
    }> = {};

    // Update name if provided
    if (updateUserDto.name) {
      updateData.name = updateUserDto.name.trim();
    }

    // Update username if provided
    if (updateUserDto.username) {
      updateData.username = updateUserDto.username.trim().toLowerCase();
    }

    // Update password if provided
    if (updateUserDto.password) {
      if (updateUserDto.password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    // Handle image upload if provided
    if (imageFile) {
      // Remove old image if it exists
      if (user.imageUrl) {
        const oldImagePath = path.join(process.cwd(), user.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (error) {
            console.warn(`Failed to delete old image: ${oldImagePath}`, error);
          }
        }
      }

      const uploadsDir = path.join(process.cwd(), 'uploads', 'user-images');
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      // Generate unique filename
      const fileExtension = path.extname(imageFile.originalname);
      const fileName = `user-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);
      // Save file
      fs.writeFileSync(filePath, imageFile.buffer);
      // Update image URL
      updateData.imageUrl = `/uploads/user-images/${fileName}`;
    }

    // Update the user
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .select('-password')
      .exec();

    return {
      id: updatedUser!._id,
      name: updatedUser!.name,
      username: updatedUser!.username,
      imageUrl: updatedUser!.imageUrl,
      createdAt: updatedUser!.createdAt,
      updatedAt: updatedUser!.updatedAt,
    };
  }

  async validateUser(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }
}
