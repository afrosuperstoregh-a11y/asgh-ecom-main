import { ConfigService } from '@nestjs/config';
import { IEmailService } from './interfaces/email-service.interface';
import { EmailTemplateResponse } from './dto/email-response.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto } from './dto/email-response.dto';
export declare class SendGridService implements IEmailService {
    private readonly configService;
    private readonly logger;
    private readonly isProduction;
    constructor(configService: ConfigService);
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
