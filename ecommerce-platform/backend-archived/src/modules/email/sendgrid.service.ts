// backend/src/common/email/sendgrid.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sendgrid from '@sendgrid/mail';
import { IEmailService } from './interfaces/email-service.interface';
import { EmailTemplateResponse } from './dto/email-response.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto } from './dto/email-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SendGridService implements IEmailService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    
    if (this.isProduction) {
      const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
      if (!apiKey) {
        this.logger.warn('SENDGRID_API_KEY is not set. Emails will be logged but not sent.');
      } else {
        sendgrid.setApiKey(apiKey);
      }
    }
  }

  async sendEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto> {
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();
    
    try {
      this.logger.log(`[${requestId}] Preparing to send email to: ${emailData.to}`);
      
      const msg: sendgrid.MailDataRequired = {
        to: emailData.to,
        from: emailData.from || this.configService.get('EMAIL_FROM') || 'noreply@example.com',
        subject: emailData.subject,
        text: emailData.text || '',
        html: emailData.html,
        templateId: emailData.templateId,
        dynamicTemplateData: emailData.dynamicTemplateData,
        attachments: emailData.attachments,
        sendAt: emailData.sendAt,
        batchId: emailData.batchId,
        ipPoolName: emailData.ipPoolName,
        customArgs: {
          requestId,
          ...emailData.metadata,
        },
      };

      this.logger.debug(`[${requestId}] Sending email with data:`, {
        to: emailData.to,
        subject: emailData.subject,
        templateId: emailData.templateId,
        hasDynamicData: !!emailData.dynamicTemplateData,
      });

      if (!this.isProduction) {
        this.logger.log(`[${requestId}] [MOCK] Email would be sent in production`);
        return {
          success: true,
          messageId: `mock-${requestId}`,
          statusCode: 202,
          headers: {},
          body: { message: 'Email sent successfully (mocked in non-production)' },
        };
      }

      const [response] = await sendgrid.send(msg);
      
      this.logger.log(`[${requestId}] Email sent successfully`);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'] || '',
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
      };
    } catch (error) {
      const errorMessage = error.response?.body?.errors?.[0]?.message || error.message;
      this.logger.error(`[${requestId}] Failed to send email: ${errorMessage}`, error.stack);
      
      return {
        success: false,
        error: 'Failed to send email',
        errorDetails: {
          message: errorMessage,
          timestamp,
          requestId,
          statusCode: error.code || 500,
        },
      };
    }
  }

  async sendTemplateEmail(
    templateId: string,
    emailData: Omit<SendEmailDto, 'templateId'>
  ): Promise<SendEmailResponseDto> {
    return this.sendEmail({
      ...emailData,
      templateId,
    });
  }

  async getTemplate(templateId: string): Promise<EmailTemplateResponse> {
    if (!this.isProduction) {
      return {
        success: true,
        templateId,
        name: 'Mock Template',
        generation: 'dynamic',
        updatedAt: new Date().toISOString(),
        versions: [
          {
            id: 'mock-version-1',
            template_id: templateId,
            active: 1,
            name: 'Mock Template Version',
            html_content: '<p>Mock HTML content for template</p>',
            plain_content: 'Mock plain content for template',
            generate_plain_content: true,
            subject: 'Mock Email Subject',
            updated_at: new Date().toISOString(),
            editor: 'design',
            thumbnail_url: 'https://via.placeholder.com/150',
          },
        ],
      };
    }

    try {
      // In a real implementation, this would call SendGrid's API
      // const [response] = await sendgrid.request({
      //   method: 'GET',
      //   url: `/v3/templates/${templateId}`,
      // });
      
      // For now, we'll return a mock response
      throw new Error('Not implemented in this example');
    } catch (error) {
      this.logger.error(`Failed to get template ${templateId}: ${error.message}`);
      throw error;
    }
  }

  async validateEmail(email: string): Promise<{
    valid: boolean;
    score: number;
    reason?: string;
    suggestions?: string[];
  }> {
    if (!this.isProduction) {
      // Simple mock validation for non-production
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      return {
        valid: isValid,
        score: isValid ? 0.9 : 0.1,
        reason: isValid ? undefined : 'Invalid email format',
        suggestions: isValid ? [] : ['Check for typos in the email address'],
      };
    }

    try {
      // In a real implementation, this would call SendGrid's email validation API
      // const [response] = await sendgrid.request({
      //   method: 'POST',
      //   url: '/v3/validations/email',
      //   body: { email },
      // });
      
      // For now, we'll return a mock response
      return {
        valid: true,
        score: 0.95,
      };
    } catch (error) {
      this.logger.error(`Email validation failed: ${error.message}`);
      // Fallback to basic validation
      return {
        valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        score: 0.5,
        reason: 'Validation service unavailable',
      };
    }
  }
}