import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto, EmailTemplateResponse } from './dto/email-response.dto';
export declare class EmailController {
    private readonly emailService;
    private readonly logger;
    constructor(emailService: EmailService);
    sendEmail(sendEmailDto: SendEmailDto): Promise<SendEmailResponseDto>;
    sendTemplateEmail(templateId: string, sendEmailDto: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
    getTemplate(templateId: string): Promise<EmailTemplateResponse>;
    validateEmail(email: string): Promise<{
        valid: boolean;
        score: number;
        reason?: string;
        suggestions?: string[];
    }>;
    sendTestEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto>;
    sendOrderConfirmation(emailData: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
    sendPasswordReset(emailData: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
    sendVerificationEmail(emailData: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
    sendOrderShipped(emailData: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
}
