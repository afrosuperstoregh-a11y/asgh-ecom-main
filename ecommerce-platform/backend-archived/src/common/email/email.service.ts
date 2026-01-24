// email.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mockSendGridClient, MockSendGridClient } from './mock-sendgrid.client';
import { IEmailService } from './interfaces/email-service.interface';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto, EmailTemplateResponse } from './dto/email-response.dto';

@Injectable()
export class EmailService implements IEmailService, OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private isProduction: boolean;
  private defaultFrom: { email: string; name: string };

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    this.defaultFrom = {
      email: this.configService.get('EMAIL_FROM') || 'noreply@example.com',
      name: this.configService.get('EMAIL_FROM_NAME') || 'E-Commerce Platform',
    };
  }

  async onModuleInit() {
    try {
      const isHealthy = await this.isHealthy();
      this.logger.log(`Email service initialized successfully. Production mode: ${this.isProduction}, Healthy: ${isHealthy}`);
    } catch (error) {
      this.logger.error('Failed to initialize email service', error.stack);
      throw error;
    }
  }

  async sendEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto> {
    try {
      this.validateEmailData(emailData);

      const formattedEmail = this.formatEmailData(emailData);
      const [response] = await mockSendGridClient.send(formattedEmail);

      this.logger.debug(`Email sent successfully to ${emailData.to.map(t => t.email).join(', ')}`);

      return {
        success: response.statusCode >= 200 && response.statusCode < 300,
        messageId: response.body.messageId,
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return {
        success: false,
        statusCode: 500,
        errors: [{
          message: error.message,
          field: error.field || 'unknown',
        }],
      };
    }
  }

  async sendTemplateEmail(
    templateId: string, 
    emailData: Omit<SendEmailDto, 'templateId'>
  ): Promise<SendEmailResponseDto> {
    try {
      // Verify template exists
      await this.getTemplate(templateId);
      return this.sendEmail({
        ...emailData,
        templateId,
      });
    } catch (error) {
      this.logger.error(`Failed to send template email: ${error.message}`, error.stack);
      return {
        success: false,
        statusCode: 400,
        errors: [{
          message: `Invalid template: ${error.message}`,
          field: 'templateId',
        }],
      };
    }
  }

  async getTemplate(templateId: string): Promise<EmailTemplateResponse> {
    try {
      return await mockSendGridClient.getTemplate(templateId);
    } catch (error) {
      this.logger.error(`Failed to get template ${templateId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyEmail(email: string): Promise<boolean> {
    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async getEmailActivity(messageId: string): Promise<any> {
    try {
      return await mockSendGridClient.getEmailStatus(messageId);
    } catch (error) {
      this.logger.error(`Failed to get email activity for ${messageId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await mockSendGridClient.isHealthy();
    } catch (error) {
      this.logger.error('Email service health check failed', error.stack);
      return false;
    }
  }

  private validateEmailData(emailData: SendEmailDto): void {
    if (!emailData.to || emailData.to.length === 0) {
      throw new Error('At least one recipient is required');
    }

    if (!emailData.subject && !emailData.templateId) {
      throw new Error('Email subject is required when no template is provided');
    }

    if (!emailData.text && !emailData.html && !emailData.templateId) {
      throw new Error('Email content (text or html) is required when no template is provided');
    }
  }

  private formatEmailData(emailData: SendEmailDto): any {
    return {
      to: emailData.to,
      from: emailData.from || this.defaultFrom,
      cc: emailData.cc,
      bcc: emailData.bcc,
      replyTo: emailData.replyTo,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      templateId: emailData.templateId,
      dynamicTemplateData: emailData.dynamicTemplateData,
      sendAt: emailData.sendAt,
      attachments: emailData.attachments,
      customArgs: {
        ...emailData.customArgs,
        environment: this.configService.get('NODE_ENV') || 'development',
      },
    };
  }
}