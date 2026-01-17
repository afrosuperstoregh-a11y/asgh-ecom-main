import { Injectable, Logger, Inject } from '@nestjs/common';
import { IEmailService } from './interfaces/email-service.interface';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto } from './dto/email-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject('EMAIL_SERVICE')
    private readonly emailService: IEmailService
  ) {}

  async sendEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto> {
    const requestId = uuidv4();
    this.logger.log(`[${requestId}] Sending email to: ${emailData.to}`);
    
    try {
      const result = await this.emailService.sendEmail({
        ...emailData,
        metadata: {
          ...emailData.metadata,
          requestId,
          timestamp: new Date().toISOString(),
        },
      });

      // Log the email sending result
      this.logEmailResult(requestId, emailData, result);
      
      return result;
    } catch (error) {
      this.logger.error(`[${requestId}] Failed to send email: ${error.message}`, error.stack);
      throw error;
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

  async getTemplate(templateId: string): Promise<import("./dto/email-response.dto").EmailTemplateResponse> {
    try {
      // In a real implementation, this would call the actual email service
      // For now, we'll return a mock response
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
    // Simple email validation
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return {
      valid: isValid,
      score: isValid ? 0.9 : 0.1,
      reason: isValid ? undefined : 'Invalid email format',
      suggestions: isValid ? [] : ['Check for typos in the email address'],
    };
  }

  private logEmailResult(
    requestId: string,
    emailData: SendEmailDto,
    result: SendEmailResponseDto
  ): void {
    const logData = {
      requestId,
      to: emailData.to,
      subject: emailData.subject,
      templateId: emailData.templateId,
      success: result.success,
      messageId: result.messageId,
      statusCode: result.statusCode,
    };

    if (result.success) {
      this.logger.log(`[${requestId}] Email sent successfully`, logData);
    } else {
      this.logger.error(`[${requestId}] Failed to send email`, {
        ...logData,
        error: result.error,
        errorDetails: result.errorDetails,
      });
    }
  }
}
