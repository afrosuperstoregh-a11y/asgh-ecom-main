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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mock_sendgrid_client_1 = require("./mock-sendgrid.client");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.isProduction = this.configService.get('NODE_ENV') === 'production';
        this.defaultFrom = {
            email: this.configService.get('EMAIL_FROM') || 'noreply@example.com',
            name: this.configService.get('EMAIL_FROM_NAME') || 'E-Commerce Platform',
        };
    }
    async onModuleInit() {
        try {
            const isHealthy = await this.isHealthy();
            this.logger.log(`Email service initialized successfully. Production mode: ${this.isProduction}, Healthy: ${isHealthy}`);
        }
        catch (error) {
            this.logger.error('Failed to initialize email service', error.stack);
            throw error;
        }
    }
    async sendEmail(emailData) {
        try {
            this.validateEmailData(emailData);
            const formattedEmail = this.formatEmailData(emailData);
            const [response] = await mock_sendgrid_client_1.mockSendGridClient.send(formattedEmail);
            this.logger.debug(`Email sent successfully to ${emailData.to.map(t => t.email).join(', ')}`);
            return {
                success: response.statusCode >= 200 && response.statusCode < 300,
                messageId: response.body.messageId,
                statusCode: response.statusCode,
                headers: response.headers,
                body: response.body,
            };
        }
        catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`, error.stack);
            return {
                success: false,
                statusCode: 500,
                errors: [{
                        message: error.message,
                        field: error.field || 'unknown',
                    }],
            };
        }
    }
    async sendTemplateEmail(templateId, emailData) {
        try {
            await this.getTemplate(templateId);
            return this.sendEmail({
                ...emailData,
                templateId,
            });
        }
        catch (error) {
            this.logger.error(`Failed to send template email: ${error.message}`, error.stack);
            return {
                success: false,
                statusCode: 400,
                errors: [{
                        message: `Invalid template: ${error.message}`,
                        field: 'templateId',
                    }],
            };
        }
    }
    async getTemplate(templateId) {
        try {
            return await mock_sendgrid_client_1.mockSendGridClient.getTemplate(templateId);
        }
        catch (error) {
            this.logger.error(`Failed to get template ${templateId}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async verifyEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    async getEmailActivity(messageId) {
        try {
            return await mock_sendgrid_client_1.mockSendGridClient.getEmailStatus(messageId);
        }
        catch (error) {
            this.logger.error(`Failed to get email activity for ${messageId}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async isHealthy() {
        try {
            return await mock_sendgrid_client_1.mockSendGridClient.isHealthy();
        }
        catch (error) {
            this.logger.error('Email service health check failed', error.stack);
            return false;
        }
    }
    validateEmailData(emailData) {
        if (!emailData.to || emailData.to.length === 0) {
            throw new Error('At least one recipient is required');
        }
        if (!emailData.subject && !emailData.templateId) {
            throw new Error('Email subject is required when no template is provided');
        }
        if (!emailData.text && !emailData.html && !emailData.templateId) {
            throw new Error('Email content (text or html) is required when no template is provided');
        }
    }
    formatEmailData(emailData) {
        return {
            to: emailData.to,
            from: emailData.from || this.defaultFrom,
            cc: emailData.cc,
            bcc: emailData.bcc,
            replyTo: emailData.replyTo,
            subject: emailData.subject,
            text: emailData.text,
            html: emailData.html,
            templateId: emailData.templateId,
            dynamicTemplateData: emailData.dynamicTemplateData,
            sendAt: emailData.sendAt,
            attachments: emailData.attachments,
            customArgs: {
                ...emailData.customArgs,
                environment: this.configService.get('NODE_ENV') || 'development',
            },
        };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map