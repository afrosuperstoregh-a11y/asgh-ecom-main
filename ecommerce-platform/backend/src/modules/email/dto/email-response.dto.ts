import { ApiProperty } from '@nestjs/swagger';

class TemplateVersion {
  @ApiProperty()
  id: string;

  @ApiProperty()
  template_id: string;

  @ApiProperty()
  active: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  html_content: string;

  @ApiProperty()
  plain_content: string;

  @ApiProperty()
  generate_plain_content: boolean;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  updated_at: string;

  @ApiProperty()
  editor: string;

  @ApiProperty()
  thumbnail_url: string;
}

export class EmailTemplateResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  generation: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty({ type: [TemplateVersion] })
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
