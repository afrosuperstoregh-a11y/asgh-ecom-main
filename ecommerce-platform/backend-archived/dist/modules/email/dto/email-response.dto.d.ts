declare class TemplateVersion {
    id: string;
    template_id: string;
    active: number;
    name: string;
    html_content: string;
    plain_content: string;
    generate_plain_content: boolean;
    subject: string;
    updated_at: string;
    editor: string;
    thumbnail_url: string;
}
export declare class EmailTemplateResponse {
    success: boolean;
    templateId: string;
    name: string;
    generation: string;
    updatedAt: string;
    versions: TemplateVersion[];
}
export interface SendEmailResponseDto {
    success: boolean;
    messageId?: string;
    statusCode?: number;
    headers?: Record<string, string>;
    body?: any;
    error?: string;
    errorDetails?: any;
}
export interface EmailLogEntry {
    id: string;
    recipient: string;
    template?: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'deferred';
    errorMessage?: string;
    messageId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export {};
