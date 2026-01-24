import { IEmailService } from './interfaces/email-service.interface';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto } from './dto/email-response.dto';
export declare class EmailService implements IEmailService {
    private readonly emailService;
    private readonly logger;
    constructor(emailService: IEmailService);
    sendEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto>;
    sendTemplateEmail(templateId: string, emailData: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
    getTemplate(templateId: string): Promise<import("./dto/email-response.dto").EmailTemplateResponse>;
    validateEmail(email: string): Promise<{
        valid: boolean;
        score: number;
        reason?: string;
        suggestions?: string[];
    }>;
    private logEmailResult;
}
