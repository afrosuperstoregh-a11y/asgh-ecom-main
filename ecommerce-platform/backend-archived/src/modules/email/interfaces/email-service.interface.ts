import { SendEmailDto } from '../dto/send-email.dto';
import { SendEmailResponseDto, EmailTemplateResponse } from '../dto/email-response.dto';

export interface IEmailService {
  /**
   * Sends an email using the configured email provider
   * @param emailData Email data including recipient, subject, and content
   */
  sendEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto>;

  /**
   * Sends an email using a template
   * @param templateId The SendGrid template ID
   * @param emailData Email data including recipient and template data
   */
  sendTemplateEmail(
    templateId: string,
    emailData: Omit<SendEmailDto, 'templateId'>
  ): Promise<SendEmailResponseDto>;

  /**
   * Gets information about an email template
   * @param templateId The SendGrid template ID
   */
  getTemplate(templateId: string): Promise<EmailTemplateResponse>;

  /**
   * Validates an email address using SendGrid's validation
   * @param email The email address to validate
   */
  validateEmail(email: string): Promise<{
    valid: boolean;
    score: number;
    reason?: string;
    suggestions?: string[];
  }>;
}
