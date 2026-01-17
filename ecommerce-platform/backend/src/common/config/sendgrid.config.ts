import { registerAs } from '@nestjs/config';

export default registerAs('sendgrid', () => ({
  apiKey: process.env.SENDGRID_API_KEY || 'mock_sendgrid_key',
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'no-reply@mockstore.com',
  fromName: process.env.SENDGRID_FROM_NAME || 'Mock Store',
  sandboxMode: process.env.SENDGRID_SANDBOX_MODE !== 'false', // true by default
  templateIds: {
    orderConfirmation: 'd-mock-order-confirmation',
    passwordReset: 'd-mock-password-reset',
    accountVerification: 'd-mock-account-verification',
    adminNotification: 'd-mock-admin-notification',
  },
}));
