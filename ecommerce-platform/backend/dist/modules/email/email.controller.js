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
var EmailController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const email_service_1 = require("./email.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const email_response_dto_1 = require("./dto/email-response.dto");
let EmailController = EmailController_1 = class EmailController {
    constructor(emailService) {
        this.emailService = emailService;
        this.logger = new common_1.Logger(EmailController_1.name);
    }
    async sendEmail(sendEmailDto) {
        try {
            this.logger.log(`Sending email to: ${sendEmailDto.to}`);
            return await this.emailService.sendEmail(sendEmailDto);
        }
        catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to send email');
        }
    }
    async sendTemplateEmail(templateId, sendEmailDto) {
        try {
            this.logger.log(`Sending template email (${templateId}) to: ${sendEmailDto.to}`);
            return await this.emailService.sendTemplateEmail(templateId, sendEmailDto);
        }
        catch (error) {
            this.logger.error(`Failed to send template email: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to send template email');
        }
    }
    async getTemplate(templateId) {
        try {
            return await this.emailService.getTemplate(templateId);
        }
        catch (error) {
            this.logger.error(`Failed to get template: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Failed to get email template');
        }
    }
    async validateEmail(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        try {
            return await this.emailService.validateEmail(email);
        }
        catch (error) {
            this.logger.error(`Email validation failed: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Email validation failed');
        }
    }
    async sendTestEmail(emailData) {
        return this.emailService.sendEmail({
            ...emailData,
            subject: emailData.subject || 'Test Email from E-Commerce Platform',
            text: emailData.text || 'This is a test email sent from the E-Commerce Platform.',
        });
    }
    async sendOrderConfirmation(emailData) {
        return this.emailService.sendTemplateEmail('order-confirmation', {
            ...emailData,
            subject: emailData.subject || 'Your Order Confirmation',
        });
    }
    async sendPasswordReset(emailData) {
        return this.emailService.sendTemplateEmail('password-reset', {
            ...emailData,
            subject: emailData.subject || 'Password Reset Request',
        });
    }
    async sendVerificationEmail(emailData) {
        return this.emailService.sendTemplateEmail('account-verification', {
            ...emailData,
            subject: emailData.subject || 'Verify Your Email Address',
        });
    }
    async sendOrderShipped(emailData) {
        return this.emailService.sendTemplateEmail('order-shipped', {
            ...emailData,
            subject: emailData.subject || 'Your Order Has Shipped',
        });
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Post)('send'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: 'Send an email' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Email sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too Many Requests' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.ACCEPTED, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('templates/:templateId/send'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: 'Send an email using a template' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Templated email sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.ACCEPTED, type: Object }),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendTemplateEmail", null);
__decorate([
    (0, common_1.Get)('templates/:templateId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get email template by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Template found', type: email_response_dto_1.EmailTemplateResponse }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Template not found' }),
    openapi.ApiResponse({ status: 200, type: require("./dto/email-response.dto").EmailTemplateResponse }),
    __param(0, (0, common_1.Param)('templateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Get)('validate-email'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate an email address' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email validation result' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "validateEmail", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Send a test email' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Test email sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.BAD_REQUEST, description: 'Invalid input' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendTestEmail", null);
__decorate([
    (0, common_1.Post)('order-confirmation'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Send order confirmation email' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Order confirmation email sent' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendOrderConfirmation", null);
__decorate([
    (0, common_1.Post)('password-reset'),
    (0, swagger_1.ApiOperation)({ summary: 'Send password reset email' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Password reset email sent' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendPasswordReset", null);
__decorate([
    (0, common_1.Post)('account-verification'),
    (0, swagger_1.ApiOperation)({ summary: 'Send account verification email' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Verification email sent' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendVerificationEmail", null);
__decorate([
    (0, common_1.Post)('order-shipped'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Send order shipped notification' }),
    (0, swagger_1.ApiResponse)({ status: common_1.HttpStatus.CREATED, description: 'Order shipped notification sent' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendOrderShipped", null);
exports.EmailController = EmailController = EmailController_1 = __decorate([
    (0, swagger_1.ApiTags)('emails'),
    (0, common_1.Controller)('emails'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map