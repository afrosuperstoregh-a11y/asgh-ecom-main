"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderConfirmationTemplate = void 0;
const orderConfirmationTemplate = (data) => {
    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - #${data.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .order-details { margin: 20px 0; }
        .order-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-items th, .order-items td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        .order-items th { background-color: #f5f5f5; }
        .totals { margin-left: auto; width: 300px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank you for your order!</h1>
          <p>Order #${data.orderNumber} • ${data.orderDate}</p>
        </div>
        
        <div class="order-details">
          <h2>Order Summary</h2>
          <table class="order-items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <p><strong>Subtotal:</strong> ${formatCurrency(data.subtotal)}</p>
            <p><strong>Shipping:</strong> ${formatCurrency(data.shipping)}</p>
            <p><strong>Tax:</strong> ${formatCurrency(data.tax)}</p>
            <p><strong>Total:</strong> ${formatCurrency(data.total)}</p>
          </div>
        </div>
        
        <div class="shipping-address">
          <h3>Shipping Address</h3>
          <p>${data.shippingAddress.name}<br>
          ${data.shippingAddress.street}<br>
          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}<br>
          ${data.shippingAddress.country}</p>
        </div>
        
        ${data.trackingUrl ? `
        <div class="tracking">
          <p>You can track your order <a href="${data.trackingUrl}">here</a>.</p>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>If you have any questions about your order, please contact us at 
          <a href="mailto:${data.contactEmail}">${data.contactEmail}</a> or call us at ${data.contactPhone}.</p>
          <p>Thank you for shopping with us!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
exports.orderConfirmationTemplate = orderConfirmationTemplate;
//# sourceMappingURL=order-confirmation.template.js.map