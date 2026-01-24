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
exports.EmailTemplateResponse = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class TemplateVersion {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, template_id: { required: true, type: () => String }, active: { required: true, type: () => Number }, name: { required: true, type: () => String }, html_content: { required: true, type: () => String }, plain_content: { required: true, type: () => String }, generate_plain_content: { required: true, type: () => Boolean }, subject: { required: true, type: () => String }, updated_at: { required: true, type: () => String }, editor: { required: true, type: () => String }, thumbnail_url: { required: true, type: () => String } };
    }
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "template_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TemplateVersion.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "html_content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "plain_content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TemplateVersion.prototype, "generate_plain_content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "subject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "updated_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "editor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TemplateVersion.prototype, "thumbnail_url", void 0);
class EmailTemplateResponse {
    static _OPENAPI_METADATA_FACTORY() {
        return { success: { required: true, type: () => Boolean }, templateId: { required: true, type: () => String }, name: { required: true, type: () => String }, generation: { required: true, type: () => String }, updatedAt: { required: true, type: () => String }, versions: { required: true, type: () => [TemplateVersion] } };
    }
}
exports.EmailTemplateResponse = EmailTemplateResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], EmailTemplateResponse.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EmailTemplateResponse.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EmailTemplateResponse.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EmailTemplateResponse.prototype, "generation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EmailTemplateResponse.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TemplateVersion] }),
    __metadata("design:type", Array)
], EmailTemplateResponse.prototype, "versions", void 0);
//# sourceMappingURL=email-response.dto.js.map