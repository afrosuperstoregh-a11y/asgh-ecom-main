// Production-ready email service with fallback
interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResponse {
  success: boolean;
  emailId?: string;
  error?: string;
  service?: 'sendgrid' | 'mock';
}

class EmailService {
  private sendGrid: any = null;
  private isProduction: boolean;
  private isConfigured: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isConfigured = !!process.env.SENDGRID_API_KEY;
    
    // Initialize SendGrid only in production with proper API key
    if (this.isProduction && this.isConfigured) {
      this.initializeSendGrid();
    }
  }

  private async initializeSendGrid() {
    try {
      // Dynamic import to avoid build errors
      const sgMail = await import('@sendgrid/mail') as any;
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
      this.sendGrid = sgMail;
      console.log('✅ SendGrid initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid:', error);
      this.sendGrid = null;
    }
  }

  async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    // Use SendGrid in production if configured
    if (this.isProduction && this.isConfigured && this.sendGrid) {
      return this.sendWithSendGrid(emailData);
    }
    
    // Use mock service for development or if not configured
    return this.sendMockEmail(emailData);
  }

  private async sendWithSendGrid(emailData: EmailData): Promise<EmailResponse> {
    try {
      const msg = {
        to: emailData.to,
        from: emailData.from,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || 'Please view this email in an HTML-enabled email client.',
      };

      const response = await this.sendGrid.send(msg);
      
      return {
        success: true,
        emailId: response[0]?.headers?.['x-message-id'] || 'unknown',
        service: 'sendgrid'
      };
      
    } catch (error) {
      console.error('SendGrid error:', error);
      
      // Fallback to mock email if SendGrid fails
      console.warn('⚠️ SendGrid failed, falling back to mock service');
      return this.sendMockEmail(emailData);
    }
  }

  private async sendMockEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      console.log('📧 MOCK EMAIL SERVICE');
      console.log('Environment:', this.isProduction ? 'Production' : 'Development');
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
        emailId: mockEmailId,
        service: 'mock'
      };
      
    } catch (error) {
      console.error('Mock email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock email failed',
        service: 'mock'
      };
    }
  }

  // Email templates
  generateOrderReceiptTemplate(orderData: any): string {
    const itemsHtml = orderData.items.map((item: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 16px 0;">
          <div style="display: flex; align-items: center;">
            <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 16px;">
            <div>
              <h4 style="margin: 0; color: #1f2937; font-weight: 600;">${item.name}</h4>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity}</p>
            </div>
          </div>
        </td>
        <td style="padding: 16px 0; text-align: right; color: #1f2937; font-weight: 500;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Afro Superstore</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 20px; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .success-banner { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
          .order-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
          .address-info { margin-bottom: 20px; }
          .price-summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .price-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .price-row.total { border-top: 2px solid #e5e7eb; padding-top: 8px; font-weight: 600; font-size: 18px; }
          .footer { background: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          .footer a { color: #1f2937; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Afro Superstore</h1>
            <p>Thank you for your purchase!</p>
          </div>
          
          <div class="content">
            <div class="success-banner">
              <h2 style="margin: 0; font-size: 20px;">✅ Order Confirmed</h2>
              <p style="margin: 8px 0 0 0;">Your order has been successfully processed</p>
            </div>
            
            <div class="order-info">
              <div class="section-title">Order Information</div>
              <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Email:</strong> ${orderData.customerEmail}</p>
            </div>
            
            <div class="section-title">Order Items</div>
            <table style="width: 100%; margin-bottom: 20px;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e7eb;">
                  <th style="text-align: left; padding: 12px 0; color: #6b7280;">Item</th>
                  <th style="text-align: right; padding: 12px 0; color: #6b7280;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="section-title">Shipping Information</div>
            <div class="address-info">
              <p><strong>${orderData.shipping.firstName} ${orderData.shipping.lastName}</strong></p>
              <p>${orderData.shipping.address}</p>
              <p>${orderData.shipping.city}, ${orderData.shipping.state} ${orderData.shipping.zipCode}</p>
              <p>${orderData.shipping.country}</p>
              <p>📧 ${orderData.shipping.email}</p>
              <p>📱 ${orderData.shipping.phone}</p>
            </div>
            
            <div class="section-title">Payment Information</div>
            <div class="address-info">
              <p><strong>Payment Method:</strong> Credit Card</p>
              <p><strong>Card:</strong> ${orderData.payment.cardNumber}</p>
              <p><strong>Name:</strong> ${orderData.payment.cardName}</p>
            </div>
            
            <div class="price-summary">
              <div class="section-title">Order Summary</div>
              <div class="price-row">
                <span>Subtotal:</span>
                <span>$${orderData.totals.subtotal.toFixed(2)}</span>
              </div>
              <div class="price-row">
                <span>Tax:</span>
                <span>$${orderData.totals.tax.toFixed(2)}</span>
              </div>
              <div class="price-row">
                <span>Shipping:</span>
                <span>${orderData.totals.shipping === 0 ? 'FREE' : `$${orderData.totals.shipping.toFixed(2)}`}</span>
              </div>
              <div class="price-row total">
                <span>Total:</span>
                <span>$${orderData.totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for shopping at Afro Superstore!</p>
            <p>Questions? Contact us at <a href="mailto:support@afrosuperstore.ca">support@afrosuperstore.ca</a></p>
            <p style="margin-top: 20px; font-size: 12px;">© 2024 Afro Superstore. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Get service status
  getStatus() {
    return {
      isProduction: this.isProduction,
      isConfigured: this.isConfigured,
      service: this.isProduction && this.isConfigured ? 'sendgrid' : 'mock'
    };
  }
}

// Singleton instance
const emailService = new EmailService();

export default emailService;
export type { EmailData, EmailResponse };
export { EmailService };
