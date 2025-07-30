import * as mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (configService: ConfigService): Promise<typeof mongoose> => {
      const uri = configService.get<string>('MONGODB_URI');
      if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }
      return mongoose.connect(uri);
    },
    inject: [ConfigService],
  },
];
