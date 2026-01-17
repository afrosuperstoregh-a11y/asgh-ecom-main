// backend/src/modules/email/email-logger.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { SendEmailDto } from './dto/send-email.dto';
import { SendEmailResponseDto } from './dto/email-response.dto';

@Injectable()
export class EmailLoggerService {
  private readonly logger = new Logger(EmailLoggerService.name);

  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
  ) {}

  async logEmailAttempt(
    emailData: SendEmailDto,
    requestId: string,
  ): Promise<EmailLog | null> {
    try {
      const logEntry = this.emailLogRepository.create({
        recipient: Array.isArray(emailData.to) ? emailData.to[0] : emailData.to,
        template: emailData.templateId || null,
        status: EmailStatus.PENDING,
        requestId,
        metadata: {
          ...emailData.metadata,
          subject: emailData.subject,
          templateData: emailData.dynamicTemplateData,
        },
      });

      return await this.emailLogRepository.save(logEntry);
    } catch (error) {
      this.logger.error(`Failed to log email attempt: ${error.message}`, error.stack);
      // Don't throw to avoid breaking the email sending flow
      return null;
    }
  }

  async updateEmailStatus(
    logId: string,
    status: EmailStatus,
    result: SendEmailResponseDto,
  ): Promise<void> {
    try {
      const updateData: Partial<EmailLog> = {
        status,
        updatedAt: new Date(),
      };

      if (result.success) {
        updateData.messageId = result.messageId;
      } else {
        updateData.errorMessage = result.error;
        updateData.metadata = {
          ...(updateData.metadata || {}),
          errorDetails: result.errorDetails,
        };
      }

      await this.emailLogRepository.update(logId, updateData);
    } catch (error) {
      this.logger.error(`Failed to update email status: ${error.message}`, error.stack);
    }
  }

  async getEmailLogs(
    options: {
      recipient?: string;
      status?: EmailStatus;
      template?: string;
      startDate?: Date;
      endDate?: Date;
      skip?: number;
      take?: number;
    } = {},
  ): Promise<{ data: EmailLog[]; total: number }> {
    try {
      const { recipient, status, template, startDate, endDate, skip = 0, take = 20 } = options;

      const query = this.emailLogRepository
        .createQueryBuilder('log')
        .orderBy('log.createdAt', 'DESC')
        .skip(skip)
        .take(take);

      if (recipient) {
        query.andWhere('log.recipient = :recipient', { recipient });
      }

      if (status) {
        query.andWhere('log.status = :status', { status });
      }

      if (template) {
        query.andWhere('log.template = :template', { template });
      }

      if (startDate) {
        query.andWhere('log.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        query.andWhere('log.createdAt <= :endDate', { endDate });
      }

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error) {
      this.logger.error(`Failed to fetch email logs: ${error.message}`, error.stack);
      return { data: [], total: 0 };
    }
  }

  async getEmailLogById(id: string): Promise<EmailLog | null> {
    try {
      return await this.emailLogRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to fetch email log: ${error.message}`, error.stack);
      return null;
    }
  }
}