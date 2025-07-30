import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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

  async getUserById(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId, { password: 0 }).exec();

    if (!user) {
      throw new NotFoundException('User not found');
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
}
