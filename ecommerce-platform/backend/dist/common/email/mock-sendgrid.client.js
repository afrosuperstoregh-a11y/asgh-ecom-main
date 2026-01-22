"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockSendGridClient = exports.MockSendGridClient = void 0;
const common_1 = require("@nestjs/common");
class MockSendGridClient {
    constructor() {
        this.logger = new common_1.Logger(MockSendGridClient.name);
        this.emailLogs = [];
        this.templates = {
            'order-confirmation': {
                id: 'order-confirmation',
                name: 'Order Confirmation',
                generation: 'dynamic',
                updated_at: new Date().toISOString(),
                versions: [{
                        id: 'v1',
                        template_id: 'order-confirmation',
                        active: 1,
                        name: 'Order Confirmation',
                        updated_at: new Date().toISOString(),
                        generate_plain_content: true,
                        subject: 'Your Order #{{orderNumber}} has been confirmed',
                        editor: 'design',
                        thumbnail_url: 'https://example.com/templates/order-confirmation.jpg'
                    }]
            },
            'password-reset': {
                id: 'password-reset',
                name: 'Password Reset',
                generation: 'dynamic',
                updated_at: new Date().toISOString(),
                versions: [{
                        id: 'v1',
                        template_id: 'password-reset',
                        active: 1,
                        name: 'Password Reset',
                        updated_at: new Date().toISOString(),
                        generate_plain_content: true,
                        subject: 'Reset your password',
                        editor: 'design',
                        thumbnail_url: 'https://example.com/templates/password-reset.jpg'
                    }]
            },
            'account-verification': {
                id: 'account-verification',
                name: 'Account Verification',
                generation: 'dynamic',
                updated_at: new Date().toISOString(),
                versions: [{
                        id: 'v1',
                        template_id: 'account-verification',
                        active: 1,
                        name: 'Account Verification',
                        updated_at: new Date().toISOString(),
                        generate_plain_content: true,
                        subject: 'Verify your email address',
                        editor: 'design',
                        thumbnail_url: 'https://example.com/templates/account-verification.jpg'
                    }]
            },
            'order-shipped': {
                id: 'order-shipped',
                name: 'Order Shipped',
                generation: 'dynamic',
                updated_at: new Date().toISOString(),
                versions: [{
                        id: 'v1',
                        template_id: 'order-shipped',
                        active: 1,
                        name: 'Order Shipped',
                        updated_at: new Date().toISOString(),
                        generate_plain_content: true,
                        subject: 'Your Order #{{orderNumber}} has been shipped',
                        editor: 'design',
                        thumbnail_url: 'https://example.com/templates/order-shipped.jpg'
                    }]
            }
        };
    }
    async send(mailData, isMultiple = false) {
        const emails = isMultiple ? mailData : [mailData];
        for (const email of emails) {
            const messageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date();
            try {
                if (!email.to || (Array.isArray(email.to) && email.to.length === 0) || !email.from) {
                    throw new Error('Missing required email fields: to and from are required');
                }
                const recipients = Array.isArray(email.to) ? email.to : [email.to];
                if (recipients.length === 0) {
                    throw new Error('At least one recipient is required');
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                for (const recipient of recipients) {
                    const emailToCheck = typeof recipient === 'string' ? recipient : recipient.email;
                    if (!emailRegex.test(emailToCheck)) {
                        throw new Error(`Invalid email address: ${emailToCheck}`);
                    }
                }
                const delay = 50 + Math.random() * 150;
                await new Promise(resolve => setTimeout(resolve, delay));
                const shouldFail = Math.random() < 0.05;
                if (shouldFail) {
                    throw new Error('Simulated email sending failure');
                }
                const statusRoll = Math.random();
                let status = 'sent';
                if (statusRoll > 0.95) {
                    status = 'bounced';
                }
                else if (statusRoll > 0.9) {
                    status = 'dropped';
                }
                else if (statusRoll > 0.8) {
                    status = 'delivered';
                }
                const logEntry = {
                    to: email.to,
                    from: email.from,
                    subject: email.subject || 'No subject',
                    timestamp,
                    status,
                    templateId: email.templateId,
                    messageId,
                    response: {
                        statusCode: status === 'bounced' || status === 'dropped' ? 400 : 202,
                        headers: {},
                        body: {
                            message: status === 'bounced' ? 'Email bounced' : status === 'dropped' ? 'Email dropped' : 'Email sent',
                            messageId,
                        },
                    },
                };
                this.emailLogs.push(logEntry);
                this.logger.debug(`[MockSendGrid] Email ${status}: ${JSON.stringify(logEntry)}`);
                if (status === 'sent' || status === 'delivered') {
                    setTimeout(() => {
                        const deliveredEntry = {
                            ...logEntry,
                            status: 'delivered',
                            timestamp: new Date(),
                        };
                        this.emailLogs.push(deliveredEntry);
                        if (Math.random() > 0.5) {
                            setTimeout(() => {
                                const openedEntry = {
                                    ...logEntry,
                                    status: 'opened',
                                    timestamp: new Date(),
                                };
                                this.emailLogs.push(openedEntry);
                                if (Math.random() < 0.3) {
                                    setTimeout(() => {
                                        const clickedEntry = {
                                            ...logEntry,
                                            status: 'clicked',
                                            timestamp: new Date(),
                                        };
                                        this.emailLogs.push(clickedEntry);
                                    }, 1000 + Math.random() * 5000);
                                }
                            }, 1000 + Math.random() * 10000);
                        }
                    }, 500 + Math.random() * 2000);
                }
            }
            catch (error) {
                const errorEntry = {
                    to: email.to,
                    from: email.from,
                    subject: email.subject || 'No subject',
                    timestamp,
                    status: 'failed',
                    templateId: email.templateId,
                    messageId,
                    error: error.message,
                    response: {
                        statusCode: 500,
                        headers: {},
                        body: {
                            message: error.message,
                            messageId,
                            errors: [
                                {
                                    message: error.message,
                                    field: error.field || 'unknown',
                                },
                            ],
                        },
                    },
                };
                this.emailLogs.push(errorEntry);
                this.logger.error(`[MockSendGrid] Email failed: ${JSON.stringify(errorEntry)}`);
                return [
                    {
                        statusCode: 500,
                        headers: {},
                        body: {
                            message: error.message,
                            messageId,
                            errors: [
                                {
                                    message: error.message,
                                    field: error.field || 'unknown',
                                },
                            ],
                        },
                    },
                    {},
                ];
            }
        }
        return [
            {
                statusCode: 202,
                headers: {},
                body: {
                    message: 'Email sent successfully',
                    messageId: `mock-${Date.now()}`,
                },
            },
            {},
        ];
    }
    async getTemplate(templateId) {
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        const template = this.templates[templateId];
        if (!template) {
            throw new Error(`Template with ID ${templateId} not found`);
        }
        return template;
    }
    async createTemplate(template) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        const newTemplate = {
            ...template,
            id: `tpl_${Math.random().toString(36).substr(2, 9)}`,
            updated_at: new Date().toISOString(),
        };
        this.templates[newTemplate.id] = newTemplate;
        return newTemplate;
    }
    async updateTemplate(templateId, updates) {
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));
        const template = this.templates[templateId];
        if (!template) {
            throw new Error(`Template with ID ${templateId} not found`);
        }
        const updatedTemplate = {
            ...template,
            ...updates,
            updated_at: new Date().toISOString(),
        };
        this.templates[templateId] = updatedTemplate;
        return updatedTemplate;
    }
    async deleteTemplate(templateId) {
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
        if (!this.templates[templateId]) {
            throw new Error(`Template with ID ${templateId} not found`);
        }
        delete this.templates[templateId];
    }
    async getEmailStatus(messageId) {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        const events = this.emailLogs.filter(log => log.messageId === messageId);
        if (events.length === 0) {
            throw new Error(`No email found with message ID: ${messageId}`);
        }
        return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    getEmailLogs() {
        return [...this.emailLogs];
    }
    clearEmailLogs() {
        this.emailLogs = [];
    }
    getTemplates() {
        return { ...this.templates };
    }
    clearTemplates() {
        for (const key in this.templates) {
            delete this.templates[key];
        }
    }
    async isHealthy() {
        await new Promise(resolve => setTimeout(resolve, 50));
        return true;
    }
}
exports.MockSendGridClient = MockSendGridClient;
exports.mockSendGridClient = new MockSendGridClient();
//# sourceMappingURL=mock-sendgrid.client.js.map