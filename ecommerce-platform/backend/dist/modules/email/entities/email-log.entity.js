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
exports.EmailLog = exports.EmailStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
var EmailStatus;
(function (EmailStatus) {
    EmailStatus["PENDING"] = "pending";
    EmailStatus["SENT"] = "sent";
    EmailStatus["DELIVERED"] = "delivered";
    EmailStatus["FAILED"] = "failed";
    EmailStatus["BOUNCED"] = "bounced";
    EmailStatus["DEFERRED"] = "deferred";
})(EmailStatus || (exports.EmailStatus = EmailStatus = {}));
let EmailLog = class EmailLog {
    constructor(partial) {
        Object.assign(this, partial);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, recipient: { required: true, type: () => String }, template: { required: true, type: () => String, nullable: true }, status: { required: true, enum: require("./email-log.entity").EmailStatus }, errorMessage: { required: true, type: () => String, nullable: true }, messageId: { required: true, type: () => String, nullable: true }, requestId: { required: true, type: () => String, nullable: true }, metadata: { required: true, type: () => Object, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.EmailLog = EmailLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EmailLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], EmailLog.prototype, "recipient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], EmailLog.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EmailStatus,
        default: EmailStatus.PENDING,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], EmailLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EmailLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], EmailLog.prototype, "messageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], EmailLog.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], EmailLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], EmailLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], EmailLog.prototype, "updatedAt", void 0);
exports.EmailLog = EmailLog = __decorate([
    (0, typeorm_1.Entity)('email_logs'),
    __metadata("design:paramtypes", [Object])
], EmailLog);
//# sourceMappingURL=email-log.entity.js.map