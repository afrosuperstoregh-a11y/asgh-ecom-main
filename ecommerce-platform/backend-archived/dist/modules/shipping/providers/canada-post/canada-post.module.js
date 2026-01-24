"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanadaPostModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const canada_post_service_1 = require("./canada-post.service");
let CanadaPostModule = class CanadaPostModule {
};
exports.CanadaPostModule = CanadaPostModule;
exports.CanadaPostModule = CanadaPostModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    timeout: 30000,
                    maxRedirects: 5,
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [canada_post_service_1.CanadaPostService],
        exports: [canada_post_service_1.CanadaPostService],
    })
], CanadaPostModule);
//# sourceMappingURL=canada-post.module.js.map