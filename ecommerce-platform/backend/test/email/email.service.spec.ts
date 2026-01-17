// backend/test/email/email.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from '../../src/common/email/email.service';
import { mockSendGridClient } from '../../src/common/email/mock-sendgrid.client';
import { SendEmailDto, EmailRecipient } from '../../src/common/email/dto/send-email.dto';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Clear mock logs before each test
    mockSendGridClient.clearEmailLogs();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      const emailData: SendEmailDto = {
        to: [{ email: 'test@example.com' }],
        from: { email: 'sender@example.com' },
        subject: 'Test Email',
        text: 'This is a test email',
      };

      const result = await service.sendEmail(emailData);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.statusCode).toBe(202);
    });

    it('should handle email sending failure', async () => {
      // Force a failure by not providing required fields
      const emailData = {
        to: [], // Invalid: empty array
      } as unknown as SendEmailDto;
      
      const result = await service.sendEmail(emailData);
      
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
    });

    it('should use default from address when not provided', async () => {
      const emailData = {
        to: [{ email: 'test@example.com' }],
        subject: 'Test Default From',
        text: 'Testing default from address',
      } as SendEmailDto;

      await service.sendEmail(emailData);
      const logs = mockSendGridClient.getEmailLogs();
      
      expect(logs[0].from.email).toBe(configService.get('EMAIL_FROM') || 'noreply@example.com');
    });
  });

  describe('sendTemplateEmail', () => {
    it('should send a template email successfully', async () => {
      const emailData = {
        to: [{ email: 'test@example.com' }],
        from: { email: 'noreply@example.com' },
        subject: 'Test Template Email',
        dynamicTemplateData: { name: 'Test User' },
      };

      const result = await service.sendTemplateEmail('order-confirmation', emailData);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should fail with invalid template ID', async () => {
      const emailData = {
        to: [{ email: 'test@example.com' }],
        from: { email: 'noreply@example.com' },
        subject: 'Test Invalid Template',
      };

      const result = await service.sendTemplateEmail('invalid-template', emailData);
      
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('verifyEmail', () => {
    it('should validate email format correctly', async () => {
      expect(await service.verifyEmail('valid@example.com')).toBe(true);
      expect(await service.verifyEmail('invalid-email')).toBe(false);
      expect(await service.verifyEmail('')).toBe(false);
    });
  });

  describe('isHealthy', () => {
    it('should return true when service is healthy', async () => {
      expect(await service.isHealthy()).toBe(true);
    });
  });
});