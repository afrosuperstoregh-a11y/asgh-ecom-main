// canada-post.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CanadaPostService } from './canada-post.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 30000, // 30 seconds
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CanadaPostService],
  exports: [CanadaPostService],
})
export class CanadaPostModule {}