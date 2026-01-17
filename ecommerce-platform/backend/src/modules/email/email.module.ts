import { Module, Global, Provider, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { SendGridService } from './sendgrid.service';
import { IEmailService } from './interfaces/email-service.interface';

export interface EmailModuleOptions {
  isGlobal?: boolean;
  useMock?: boolean;
}

@Global()
@Module({})
export class EmailModule {
  static forRoot(options: EmailModuleOptions = {}): DynamicModule {
    const { isGlobal = true, useMock = false } = options;
    
    const emailServiceProvider: Provider = {
      provide: 'EMAIL_SERVICE',
      useFactory: (configService: ConfigService): IEmailService => {
        // In test environment or when explicitly told to use mock, use the mock service
        if (process.env.NODE_ENV === 'test' || useMock) {
          return {
            sendEmail: async () => ({
              success: true,
              messageId: 'mock-message-id',
              statusCode: 202,
            }),
            sendTemplateEmail: async () => ({
              success: true,
              messageId: 'mock-message-id',
              statusCode: 202,
            }),
            getTemplate: async () => ({
              success: true,
              templateId: 'mock-template-id',
              name: 'Mock Template',
              generation: 'dynamic',
              updatedAt: new Date().toISOString(),
              versions: [],
            }),
            validateEmail: async () => ({
              valid: true,
              score: 1,
            }),
          };
        }
        
        // In production, use SendGrid if API key is available
        if (process.env.NODE_ENV === 'production' && configService.get('SENDGRID_API_KEY')) {
          return new SendGridService(configService);
        }
        
        // Default to the mock service in development
        return new EmailService({
          sendEmail: async () => ({
            success: true,
            messageId: 'dev-mock-message-id',
            statusCode: 202,
          }),
          sendTemplateEmail: async () => ({
            success: true,
            messageId: 'dev-mock-message-id',
            statusCode: 202,
          }),
          getTemplate: async () => ({
            success: true,
            templateId: 'dev-mock-template-id',
            name: 'Dev Mock Template',
            generation: 'dynamic',
            updatedAt: new Date().toISOString(),
            versions: [],
          }),
          validateEmail: async () => ({
            valid: true,
            score: 0.9,
          }),
        });
      },
      inject: [ConfigService],
    };

    return {
      module: EmailModule,
      imports: [ConfigModule],
      providers: [
        emailServiceProvider,
        {
          provide: EmailService,
          useClass: EmailService,
        },
      ],
      exports: [emailServiceProvider, EmailService],
      global: isGlobal,
    };
  }
}