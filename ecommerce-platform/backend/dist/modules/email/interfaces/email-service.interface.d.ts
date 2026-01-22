import { SendEmailDto } from '../dto/send-email.dto';
import { SendEmailResponseDto, EmailTemplateResponse } from '../dto/email-response.dto';
export interface IEmailService {
    sendEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto>;
    sendTemplateEmail(templateId: string, emailData: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
    getTemplate(templateId: string): Promise<EmailTemplateResponse>;
    validateEmail(email: string): Promise<{
        valid: boolean;
        score: number;
        reason?: string;
        suggestions?: string[];
    }>;
}
