import { Repository } from 'typeorm';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto } from './dto/email-response.dto';
export declare class EmailLoggerService {
    private readonly emailLogRepository;
    private readonly logger;
    constructor(emailLogRepository: Repository<EmailLog>);
    logEmailAttempt(emailData: SendEmailDto, requestId: string): Promise<EmailLog | null>;
    updateEmailStatus(logId: string, status: EmailStatus, result: SendEmailResponseDto): Promise<void>;
    getEmailLogs(options?: {
        recipient?: string;
        status?: EmailStatus;
        template?: string;
        startDate?: Date;
        endDate?: Date;
        skip?: number;
        take?: number;
    }): Promise<{
        data: EmailLog[];
        total: number;
    }>;
    getEmailLogById(id: string): Promise<EmailLog | null>;
}
