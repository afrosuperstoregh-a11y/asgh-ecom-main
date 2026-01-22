export interface EmailRecipient {
    email: string;
    name?: string;
}
export interface EmailAttachment {
    content: string;
    filename: string;
    type: string;
    disposition?: string;
    contentId?: string;
}
export interface SendEmailDto {
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    from: EmailRecipient;
    replyTo?: EmailRecipient;
    subject: string;
    text?: string;
    html?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, any>;
    attachments?: EmailAttachment[];
    sendAt?: number;
    batchId?: string;
    ipPoolName?: string;
    categories?: string[];
    customArgs?: Record<string, string>;
}
