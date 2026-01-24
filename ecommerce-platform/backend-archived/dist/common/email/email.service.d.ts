import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailService } from './interfaces/email-service.interface';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto, EmailTemplateResponse } from './dto/email-response.dto';
export declare class EmailService implements IEmailService, OnModuleInit {
    private readonly configService;
    private readonly logger;
    private isProduction;
    private defaultFrom;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    sendEmail(emailData: SendEmailDto): Promise<SendEmailResponseDto>;
    sendTemplateEmail(templateId: string, emailData: Omit<SendEmailDto, 'templateId'>): Promise<SendEmailResponseDto>;
    getTemplate(templateId: string): Promise<EmailTemplateResponse>;
    verifyEmail(email: string): Promise<boolean>;
    getEmailActivity(messageId: string): Promise<any>;
    isHealthy(): Promise<boolean>;
    private validateEmailData;
    private formatEmailData;
}
