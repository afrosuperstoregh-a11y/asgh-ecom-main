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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const email_service_1 = require("./email.service");
let EmailModule = class EmailModule {
    constructor(configService, emailService) {
        this.configService = configService;
        this.emailService = emailService;
    }
    async onModuleInit() {
        if (this.configService.get('EMAIL_VERIFY_ON_STARTUP') === 'true') {
            try {
                const isHealthy = await this.emailService.isHealthy();
                if (!isHealthy) {
                    throw new Error('Email service health check failed');
                }
                console.log('Email service verified and ready');
            }
            catch (error) {
                console.error('Failed to verify email service on startup', error);
            }
        }
    }
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: 'EMAIL_SERVICE',
                useClass: email_service_1.EmailService,
            },
            email_service_1.EmailService,
        ],
        exports: [email_service_1.EmailService],
    }),
    __metadata("design:paramtypes", [config_1.ConfigService,
        email_service_1.EmailService])
], EmailModule);
//# sourceMappingURL=email.module.js.map