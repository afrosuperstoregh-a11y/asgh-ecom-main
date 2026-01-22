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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let EmailService = EmailService_1 = class EmailService {
    constructor(emailService) {
        this.emailService = emailService;
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async sendEmail(emailData) {
        const requestId = (0, uuid_1.v4)();
        this.logger.log(`[${requestId}] Sending email to: ${emailData.to}`);
        try {
            const result = await this.emailService.sendEmail({
                ...emailData,
                metadata: {
                    ...emailData.metadata,
                    requestId,
                    timestamp: new Date().toISOString(),
                },
            });
            this.logEmailResult(requestId, emailData, result);
            return result;
        }
        catch (error) {
            this.logger.error(`[${requestId}] Failed to send email: ${error.message}`, error.stack);
            throw error;
        }
    }
    async sendTemplateEmail(templateId, emailData) {
        return this.sendEmail({
            ...emailData,
            templateId,
        });
    }
    async getTemplate(templateId) {
        try {
            return {
                success: true,
                templateId,
                name: 'Mock Template',
                generation: 'dynamic',
                updatedAt: new Date().toISOString(),
                versions: [
                    {
                        id: 'mock-version-1',
                        template_id: templateId,
                        active: 1,
                        name: 'Mock Template Version',
                        html_content: '<p>Mock HTML content for template</p>',
                        plain_content: 'Mock plain content for template',
                        generate_plain_content: true,
                        subject: 'Mock Email Subject',
                        updated_at: new Date().toISOString(),
                        editor: 'design',
                        thumbnail_url: 'https://via.placeholder.com/150',
                    },
                ],
            };
        }
        catch (error) {
            this.logger.error(`Failed to get template ${templateId}: ${error.message}`);
            throw error;
        }
    }
    async validateEmail(email) {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        return {
            valid: isValid,
            score: isValid ? 0.9 : 0.1,
            reason: isValid ? undefined : 'Invalid email format',
            suggestions: isValid ? [] : ['Check for typos in the email address'],
        };
    }
    logEmailResult(requestId, emailData, result) {
        const logData = {
            requestId,
            to: emailData.to,
            subject: emailData.subject,
            templateId: emailData.templateId,
            success: result.success,
            messageId: result.messageId,
            statusCode: result.statusCode,
        };
        if (result.success) {
            this.logger.log(`[${requestId}] Email sent successfully`, logData);
        }
        else {
            this.logger.error(`[${requestId}] Failed to send email`, {
                ...logData,
                error: result.error,
                errorDetails: result.errorDetails,
            });
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('EMAIL_SERVICE')),
    __metadata("design:paramtypes", [Object])
], EmailService);
//# sourceMappingURL=email.service.js.map