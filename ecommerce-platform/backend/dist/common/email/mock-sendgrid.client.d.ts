import { SendEmailDto } from './dto/send-email.dto';
import { EmailTemplateResponse } from './dto/email-response.dto';
export interface SendGridResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: {
        message: string;
        messageId: string;
        errors?: Array<{
            message: string;
            field?: string;
        }>;
    };
}
export interface SendGridMailData extends Omit<SendEmailDto, 'to' | 'from' | 'cc' | 'bcc' | 'replyTo'> {
    to: string | Array<{
        email: string;
        name?: string;
    }>;
    from: {
        email: string;
        name?: string;
    };
    cc?: Array<{
        email: string;
        name?: string;
    }>;
    bcc?: Array<{
        email: string;
        name?: string;
    }>;
    replyTo?: {
        email: string;
        name?: string;
    };
    templateId?: string;
    dynamicTemplateData?: Record<string, any>;
    sendAt?: number;
    batchId?: string;
    ipPoolName?: string;
    categories?: string[];
    customArgs?: Record<string, string>;
    attachments?: Array<{
        content: string;
        filename: string;
        type: string;
        disposition?: string;
        contentId?: string;
    }>;
}
export declare class MockSendGridClient {
    private readonly logger;
    private emailLogs;
    private templates;
    send(mailData: SendGridMailData | SendGridMailData[], isMultiple?: boolean): Promise<[SendGridResponse, {}]>;
    getTemplate(templateId: string): Promise<EmailTemplateResponse>;
    createTemplate(template: Omit<EmailTemplateResponse, 'id' | 'updated_at'>): Promise<EmailTemplateResponse>;
    updateTemplate(templateId: string, updates: Partial<EmailTemplateResponse>): Promise<EmailTemplateResponse>;
    deleteTemplate(templateId: string): Promise<void>;
    getEmailStatus(messageId: string): Promise<{
        to: string | Array<{
            email: string;
            name?: string;
        }>;
        from: {
            email: string;
            name?: string;
        };
        subject: string;
        timestamp: Date;
        status: "sent" | "failed" | "delivered" | "opened" | "clicked" | "bounced" | "dropped";
        templateId?: string;
        messageId: string;
        response?: any;
        error?: string;
    }[]>;
    getEmailLogs(): {
        to: string | Array<{
            email: string;
            name?: string;
        }>;
        from: {
            email: string;
            name?: string;
        };
        subject: string;
        timestamp: Date;
        status: "sent" | "failed" | "delivered" | "opened" | "clicked" | "bounced" | "dropped";
        templateId?: string;
        messageId: string;
        response?: any;
        error?: string;
    }[];
    clearEmailLogs(): void;
    getTemplates(): {
        [x: string]: EmailTemplateResponse;
    };
    clearTemplates(): void;
    isHealthy(): Promise<boolean>;
}
export declare const mockSendGridClient: MockSendGridClient;
