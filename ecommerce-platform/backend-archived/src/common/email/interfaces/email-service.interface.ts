import { SendEmailDto } from '../dto/send-email.dto';
import { SendEmailResponseDto, EmailTemplateResponse } from '../dto/email-response.dto';

export interface IEmailService {
  sendEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto>;
  sendTemplateEmail(templateId: string, emailData: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
  getTemplate(templateId: string): Promise<EmailTemplateResponse>;
  verifyEmail(email: string): Promise<boolean>;
  getEmailActivity(messageId: string): Promise<any>;
  isHealthy(): Promise<boolean>;
}
