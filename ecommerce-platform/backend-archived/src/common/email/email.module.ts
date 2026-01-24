// email.module.ts
import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'EMAIL_SERVICE',
      useClass: EmailService,
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    if (this.configService.get('EMAIL_VERIFY_ON_STARTUP') === 'true') {
      try {
        const isHealthy = await this.emailService.isHealthy();
        if (!isHealthy) {
          throw new Error('Email service health check failed');
        }
        console.log('Email service verified and ready');
      } catch (error) {
        console.error('Failed to verify email service on startup', error);
        // Don't crash the app for email service issues
      }
    }
  }
}