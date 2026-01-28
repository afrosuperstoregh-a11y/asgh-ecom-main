import { NextRequest, NextResponse } from 'next/server';
import emailService from '@/lib/email-service';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardName: string;
}

interface Totals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

interface ReceiptData {
  orderNumber: string;
  customerEmail: string;
  items: OrderItem[];
  shipping: ShippingInfo;
  payment: PaymentInfo;
  totals: Totals;
}

export async function POST(request: NextRequest) {
  try {
    const receiptData: ReceiptData = await request.json();
    
    console.log('Sending receipt email for order:', receiptData.orderNumber);
    
    // Create HTML email template
    const emailHtml = generateReceiptEmail(receiptData);
    
    // Send email using email service
    const emailResponse = await emailService.sendEmail({
      to: receiptData.customerEmail,
      from: 'noreply@afrosuperstore.ca',
      subject: `Order Confirmation - ${receiptData.orderNumber}`,
      html: emailHtml
    });
    
    if (emailResponse.success && 'emailId' in emailResponse) {
      return NextResponse.json({
        success: true,
        message: 'Receipt email sent successfully',
        emailId: emailResponse.emailId,
        service: emailResponse.service
      });
    } else {
      throw new Error('error' in emailResponse ? emailResponse.error : 'Failed to send email');
    }
    
  } catch (error) {
    console.error('Receipt email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send receipt email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateReceiptEmail(data: ReceiptData): string {
  const itemsHtml = data.items.map(item => `
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
            <p><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
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
            <p><strong>${data.shipping.firstName} ${data.shipping.lastName}</strong></p>
            <p>${data.shipping.address}</p>
            <p>${data.shipping.city}, ${data.shipping.state} ${data.shipping.zipCode}</p>
            <p>${data.shipping.country}</p>
            <p>📧 ${data.shipping.email}</p>
            <p>📱 ${data.shipping.phone}</p>
          </div>
          
          <div class="section-title">Payment Information</div>
          <div class="address-info">
            <p><strong>Payment Method:</strong> Credit Card</p>
            <p><strong>Card:</strong> ${data.payment.cardNumber}</p>
            <p><strong>Name:</strong> ${data.payment.cardName}</p>
          </div>
          
          <div class="price-summary">
            <div class="section-title">Order Summary</div>
            <div class="price-row">
              <span>Subtotal:</span>
              <span>$${data.totals.subtotal.toFixed(2)}</span>
            </div>
            <div class="price-row">
              <span>Tax:</span>
              <span>$${data.totals.tax.toFixed(2)}</span>
            </div>
            <div class="price-row">
              <span>Shipping:</span>
              <span>${data.totals.shipping === 0 ? 'FREE' : `$${data.totals.shipping.toFixed(2)}`}</span>
            </div>
            <div class="price-row total">
              <span>Total:</span>
              <span>$${data.totals.total.toFixed(2)}</span>
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

