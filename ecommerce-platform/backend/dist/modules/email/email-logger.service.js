"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailLoggerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_log_entity_1 = require("./entities/email-log.entity");
let EmailLoggerService = EmailLoggerService_1 = class EmailLoggerService {
    constructor(emailLogRepository) {
        this.emailLogRepository = emailLogRepository;
        this.logger = new common_1.Logger(EmailLoggerService_1.name);
    }
    async logEmailAttempt(emailData, requestId) {
        try {
            const logEntry = this.emailLogRepository.create({
                recipient: Array.isArray(emailData.to) ? emailData.to[0] : emailData.to,
                template: emailData.templateId || null,
                status: email_log_entity_1.EmailStatus.PENDING,
                requestId,
                metadata: {
                    ...emailData.metadata,
                    subject: emailData.subject,
                    templateData: emailData.dynamicTemplateData,
                },
            });
            return await this.emailLogRepository.save(logEntry);
        }
        catch (error) {
            this.logger.error(`Failed to log email attempt: ${error.message}`, error.stack);
            return null;
        }
    }
    async updateEmailStatus(logId, status, result) {
        try {
            const updateData = {
                status,
                updatedAt: new Date(),
            };
            if (result.success) {
                updateData.messageId = result.messageId;
            }
            else {
                updateData.errorMessage = result.error;
                updateData.metadata = {
                    ...(updateData.metadata || {}),
                    errorDetails: result.errorDetails,
                };
            }
            await this.emailLogRepository.update(logId, updateData);
        }
        catch (error) {
            this.logger.error(`Failed to update email status: ${error.message}`, error.stack);
        }
    }
    async getEmailLogs(options = {}) {
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
        }
        catch (error) {
            this.logger.error(`Failed to fetch email logs: ${error.message}`, error.stack);
            return { data: [], total: 0 };
        }
    }
    async getEmailLogById(id) {
        try {
            return await this.emailLogRepository.findOne({ where: { id } });
        }
        catch (error) {
            this.logger.error(`Failed to fetch email log: ${error.message}`, error.stack);
            return null;
        }
    }
};
exports.EmailLoggerService = EmailLoggerService;
exports.EmailLoggerService = EmailLoggerService = EmailLoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_log_entity_1.EmailLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmailLoggerService);
//# sourceMappingURL=email-logger.service.js.map