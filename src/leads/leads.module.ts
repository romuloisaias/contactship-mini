import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from './entities/lead.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

import { LeadsProcessor } from './leads.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead]),
    HttpModule,
    BullModule.registerQueue({
      name: 'lead-processing',
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
          },
          ttl: 300000, // 5 minutes in milliseconds
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [LeadsController],
  providers: [LeadsService, LeadsProcessor],
  exports: [LeadsService],
})
export class LeadsModule { }