"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmailModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const email_service_1 = require("./email.service");
const sendgrid_service_1 = require("./sendgrid.service");
let EmailModule = EmailModule_1 = class EmailModule {
    static forRoot(options = {}) {
        const { isGlobal = true, useMock = false } = options;
        const emailServiceProvider = {
            provide: 'EMAIL_SERVICE',
            useFactory: (configService) => {
                if (process.env.NODE_ENV === 'test' || useMock) {
                    return {
                        sendEmail: async () => ({
                            success: true,
                            messageId: 'mock-message-id',
                            statusCode: 202,
                        }),
                        sendTemplateEmail: async () => ({
                            success: true,
                            messageId: 'mock-message-id',
                            statusCode: 202,
                        }),
                        getTemplate: async () => ({
                            success: true,
                            templateId: 'mock-template-id',
                            name: 'Mock Template',
                            generation: 'dynamic',
                            updatedAt: new Date().toISOString(),
                            versions: [],
                        }),
                        validateEmail: async () => ({
                            valid: true,
                            score: 1,
                        }),
                    };
                }
                if (process.env.NODE_ENV === 'production' && configService.get('SENDGRID_API_KEY')) {
                    return new sendgrid_service_1.SendGridService(configService);
                }
                return new email_service_1.EmailService({
                    sendEmail: async () => ({
                        success: true,
                        messageId: 'dev-mock-message-id',
                        statusCode: 202,
                    }),
                    sendTemplateEmail: async () => ({
                        success: true,
                        messageId: 'dev-mock-message-id',
                        statusCode: 202,
                    }),
                    getTemplate: async () => ({
                        success: true,
                        templateId: 'dev-mock-template-id',
                        name: 'Dev Mock Template',
                        generation: 'dynamic',
                        updatedAt: new Date().toISOString(),
                        versions: [],
                    }),
                    validateEmail: async () => ({
                        valid: true,
                        score: 0.9,
                    }),
                });
            },
            inject: [config_1.ConfigService],
        };
        return {
            module: EmailModule_1,
            imports: [config_1.ConfigModule],
            providers: [
                emailServiceProvider,
                {
                    provide: email_service_1.EmailService,
                    useClass: email_service_1.EmailService,
                },
            ],
            exports: [emailServiceProvider, email_service_1.EmailService],
            global: isGlobal,
        };
    }
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = EmailModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], EmailModule);
//# sourceMappingURL=email.module.js.map