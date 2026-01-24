// Email service - simplified version for now
// TODO: Implement SendGrid integration when API keys are configured

class EmailService {
  constructor() {
    this.enabled = false;
  }

  async sendWelcomeEmail(user, verificationToken) {
    console.log(`[EMAIL] Welcome email would be sent to ${user.email}`);
    console.log(`[EMAIL] Verification token: ${verificationToken}`);
    // TODO: Send actual email using SendGrid
  }

  async sendPasswordResetEmail(user, resetToken) {
    console.log(`[EMAIL] Password reset email would be sent to ${user.email}`);
    console.log(`[EMAIL] Reset token: ${resetToken}`);
    // TODO: Send actual email using SendGrid
  }

  async sendVerificationReminder(user, verificationToken) {
    console.log(`[EMAIL] Verification reminder would be sent to ${user.email}`);
    console.log(`[EMAIL] Verification token: ${verificationToken}`);
    // TODO: Send actual email using SendGrid
  }

  async sendLoginAlert(user, deviceInfo) {
    console.log(`[EMAIL] Login alert would be sent to ${user.email}`);
    console.log(`[EMAIL] Device info:`, deviceInfo);
    // TODO: Send actual email using SendGrid
  }

  async sendSecurityAlert(user, alertType, details) {
    console.log(`[EMAIL] Security alert would be sent to ${user.email}`);
    console.log(`[EMAIL] Alert type: ${alertType}`, details);
    // TODO: Send actual email using SendGrid
  }
}

module.exports = new EmailService();
