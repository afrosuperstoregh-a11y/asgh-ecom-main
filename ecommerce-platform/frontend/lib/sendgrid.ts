// Optional SendGrid import - only available in production
let sgMail: any;
try {
  sgMail = require('@sendgrid/mail');
} catch (error) {
  console.log('SendGrid not installed, using mock service');
}

// Initialize SendGrid with API key
if (sgMail && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendGridResponse {
  success: boolean;
  emailId?: string;
  error?: string;
}

export async function sendEmail(emailData: EmailData): Promise<SendGridResponse> {
  try {
    // Check if SendGrid is configured
    if (!sgMail || !process.env.SENDGRID_API_KEY) {
      console.warn('⚠️ SendGrid not configured. Using mock email service.');
      return sendMockEmail(emailData);
    }

    const msg = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || 'Please view this email in an HTML-enabled email client.',
    };

    const response = await sgMail.send(msg);
    
    return {
      success: true,
      emailId: response[0]?.headers?.['x-message-id'] || 'unknown'
    };
    
  } catch (error) {
    console.error('SendGrid error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Mock email service for development/testing
async function sendMockEmail(emailData: EmailData): Promise<SendGridResponse> {
  try {
    console.log('📧 MOCK EMAIL SERVICE');
    console.log('To:', emailData.to);
    console.log('From:', emailData.from);
    console.log('Subject:', emailData.subject);
    console.log('HTML Length:', emailData.html.length);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock email ID
    const mockEmailId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('✅ Mock email sent successfully. Email ID:', mockEmailId);
    
    return {
      success: true,
      emailId: mockEmailId
    };
    
  } catch (error) {
    console.error('Mock email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Mock email failed'
    };
  }
}

// Email templates
export const emailTemplates = {
  orderReceipt: (orderData: any) => ({
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    html: generateOrderReceiptTemplate(orderData)
  }),
  
  welcomeEmail: (userData: any) => ({
    subject: 'Welcome to Afro Superstore!',
    html: generateWelcomeTemplate(userData)
  }),
  
  passwordReset: (resetData: any) => ({
    subject: 'Password Reset Request',
    html: generatePasswordResetTemplate(resetData)
  })
};

function generateOrderReceiptTemplate(orderData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Afro Superstore</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1f2937;">Afro Superstore</h1>
        <h2>Order Confirmation</h2>
        <p>Thank you for your purchase!</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Email:</strong> ${orderData.customerEmail}</p>
        </div>
        
        <h3>Items Ordered</h3>
        ${orderData.items.map((item: any) => `
          <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
            <p><strong>${item.name}</strong> x ${item.quantity}</p>
            <p>$${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        `).join('')}
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Order Summary</h3>
          <p>Subtotal: $${orderData.totals.subtotal.toFixed(2)}</p>
          <p>Tax: $${orderData.totals.tax.toFixed(2)}</p>
          <p>Shipping: ${orderData.totals.shipping === 0 ? 'FREE' : `$${orderData.totals.shipping.toFixed(2)}`}</p>
          <p><strong>Total: $${orderData.totals.total.toFixed(2)}</strong></p>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Shipping Address</h3>
          <p>${orderData.shipping.firstName} ${orderData.shipping.lastName}</p>
          <p>${orderData.shipping.address}</p>
          <p>${orderData.shipping.city}, ${orderData.shipping.state} ${orderData.shipping.zipCode}</p>
          <p>${orderData.shipping.country}</p>
        </div>
        
        <p>Thank you for shopping at Afro Superstore!</p>
        <p>Questions? Contact us at <a href="mailto:support@afrosuperstore.ca">support@afrosuperstore.ca</a></p>
      </div>
    </body>
    </html>
  `;
}

function generateWelcomeTemplate(userData: any): string {
  return `
    <h1>Welcome to Afro Superstore!</h1>
    <p>Thank you for joining our community.</p>
    <p>We're excited to have you as part of our family.</p>
  `;
}

function generatePasswordResetTemplate(resetData: any): string {
  return `
    <h1>Password Reset Request</h1>
    <p>You requested to reset your password.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetData.resetLink}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
  `;
}
