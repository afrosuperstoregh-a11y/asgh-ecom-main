export interface EmailRecipient {
    email: string;
    name?: string;
}
export interface SendEmailDto {
    to: string | string[] | EmailRecipient | EmailRecipient[];
    from?: string;
    subject: string;
    text?: string;
    html?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, any>;
    attachments?: Array<{
        content: string;
        filename: string;
        type?: string;
        disposition?: string;
    }>;
    metadata?: Record<string, string>;
    sendAt?: number;
    batchId?: string;
    ipPoolName?: string;
}
