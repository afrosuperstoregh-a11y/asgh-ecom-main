"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('sendgrid', () => ({
    apiKey: process.env.SENDGRID_API_KEY || 'mock_sendgrid_key',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@mockstore.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Mock Store',
    sandboxMode: process.env.SENDGRID_SANDBOX_MODE !== 'false',
    templateIds: {
        orderConfirmation: 'd-mock-order-confirmation',
        passwordReset: 'd-mock-password-reset',
        accountVerification: 'd-mock-account-verification',
        adminNotification: 'd-mock-admin-notification',
    },
}));
//# sourceMappingURL=sendgrid.config.js.map