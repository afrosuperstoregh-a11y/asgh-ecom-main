"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SendGridService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendGridService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sendgrid = __importStar(require("@sendgrid/mail"));
const uuid_1 = require("uuid");
let SendGridService = SendGridService_1 = class SendGridService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SendGridService_1.name);
        this.isProduction = this.configService.get('NODE_ENV') === 'production';
        if (this.isProduction) {
            const apiKey = this.configService.get('SENDGRID_API_KEY');
            if (!apiKey) {
                this.logger.warn('SENDGRID_API_KEY is not set. Emails will be logged but not sent.');
            }
            else {
                sendgrid.setApiKey(apiKey);
            }
        }
    }
    async sendEmail(emailData) {
        const requestId = (0, uuid_1.v4)();
        const timestamp = new Date().toISOString();
        try {
            this.logger.log(`[${requestId}] Preparing to send email to: ${emailData.to}`);
            const msg = {
                to: emailData.to,
                from: emailData.from || this.configService.get('EMAIL_FROM') || 'noreply@example.com',
                subject: emailData.subject,
                text: emailData.text || '',
                html: emailData.html,
                templateId: emailData.templateId,
                dynamicTemplateData: emailData.dynamicTemplateData,
                attachments: emailData.attachments,
                sendAt: emailData.sendAt,
                batchId: emailData.batchId,
                ipPoolName: emailData.ipPoolName,
                customArgs: {
                    requestId,
                    ...emailData.metadata,
                },
            };
            this.logger.debug(`[${requestId}] Sending email with data:`, {
                to: emailData.to,
                subject: emailData.subject,
                templateId: emailData.templateId,
                hasDynamicData: !!emailData.dynamicTemplateData,
            });
            if (!this.isProduction) {
                this.logger.log(`[${requestId}] [MOCK] Email would be sent in production`);
                return {
                    success: true,
                    messageId: `mock-${requestId}`,
                    statusCode: 202,
                    headers: {},
                    body: { message: 'Email sent successfully (mocked in non-production)' },
                };
            }
            const [response] = await sendgrid.send(msg);
            this.logger.log(`[${requestId}] Email sent successfully`);
            return {
                success: true,
                messageId: response.headers['x-message-id'] || '',
                statusCode: response.statusCode,
                headers: response.headers,
                body: response.body,
            };
        }
        catch (error) {
            const errorMessage = error.response?.body?.errors?.[0]?.message || error.message;
            this.logger.error(`[${requestId}] Failed to send email: ${errorMessage}`, error.stack);
            return {
                success: false,
                error: 'Failed to send email',
                errorDetails: {
                    message: errorMessage,
                    timestamp,
                    requestId,
                    statusCode: error.code || 500,
                },
            };
        }
    }
    async sendTemplateEmail(templateId, emailData) {
        return this.sendEmail({
            ...emailData,
            templateId,
        });
    }
    async getTemplate(templateId) {
        if (!this.isProduction) {
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
        try {
            throw new Error('Not implemented in this example');
        }
        catch (error) {
            this.logger.error(`Failed to get template ${templateId}: ${error.message}`);
            throw error;
        }
    }
    async validateEmail(email) {
        if (!this.isProduction) {
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            return {
                valid: isValid,
                score: isValid ? 0.9 : 0.1,
                reason: isValid ? undefined : 'Invalid email format',
                suggestions: isValid ? [] : ['Check for typos in the email address'],
            };
        }
        try {
            return {
                valid: true,
                score: 0.95,
            };
        }
        catch (error) {
            this.logger.error(`Email validation failed: ${error.message}`);
            return {
                valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
                score: 0.5,
                reason: 'Validation service unavailable',
            };
        }
    }
};
exports.SendGridService = SendGridService;
exports.SendGridService = SendGridService = SendGridService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SendGridService);
//# sourceMappingURL=sendgrid.service.js.map