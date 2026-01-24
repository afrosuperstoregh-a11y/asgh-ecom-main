interface EmailError {
    message: string;
    field?: string;
    help?: string;
}
export interface SendEmailResponseDto {
    success: boolean;
    messageId?: string;
    statusCode: number;
    headers?: Record<string, string>;
    body?: Record<string, any>;
    errors?: EmailError[];
}
export interface EmailTemplateResponse {
    id: string;
    name: string;
    generation: 'dynamic' | 'legacy';
    updated_at: string;
    versions: Array<{
        id: string;
        template_id: string;
        active: number;
        name: string;
        updated_at: string;
        generate_plain_content: boolean;
        subject: string;
        editor: 'code' | 'design';
        thumbnail_url: string;
    }>;
}
export {};
