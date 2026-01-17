const sgMail = require('@sendgrid/mail');

class SendGridService {
  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;
    this.fromName = process.env.SENDGRID_FROM_NAME;
    
    if (!this.apiKey) {
      console.warn('SendGrid API key not configured');
    } else {
      sgMail.setApiKey(this.apiKey);
    }
  }

  async sendEmail(options) {
    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const {
        to,
        subject,
        html,
        text,
        from = this.fromEmail,
        fromName = this.fromName,
        attachments,
        categories,
        customArgs
      } = options;

      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: from,
          name: fromName
        },
        subject,
        html: html || text,
        text: text || html
      };

      if (attachments && attachments.length > 0) {
        msg.attachments = attachments;
      }

      if (categories && categories.length > 0) {
        msg.categories = categories;
      }

      if (customArgs) {
        msg.customArgs = customArgs;
      }

      const response = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || response[0]?.headers?.messageId,
        statusCode: response[0]?.statusCode
      };
    } catch (error) {
      console.error('SendGrid error:', error);
      
      if (error.response) {
        console.error('SendGrid response body:', error.response.body);
        throw new Error(`SendGrid API error: ${error.response.body?.errors?.[0]?.message || error.message}`);
      }
      
      throw error;
    }
  }

  async sendTemplateEmail(options) {
    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const {
        to,
        templateId,
        dynamicTemplateData,
        from = this.fromEmail,
        fromName = this.fromName,
        categories,
        customArgs
      } = options;

      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: from,
          name: fromName
        },
        templateId,
        dynamicTemplateData
      };

      if (categories && categories.length > 0) {
        msg.categories = categories;
      }

      if (customArgs) {
        msg.customArgs = customArgs;
      }

      const response = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || response[0]?.headers.messageId,
        statusCode: response[0]?.statusCode
      };
    } catch (error) {
      console.error('SendGrid template error:', error);
      
      if (error.response) {
        console.error('SendGrid response body:', error.response.body);
        throw new Error(`SendGrid API error: ${error.response.body?.errors?.[0]?.message || error.message}`);
      }
      
      throw error;
    }
  }

  async createTemplate(templateData) {
    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const { name, subject, htmlContent, textContent, generatePlainContent = true } = templateData;

      const response = await sgMail.request({
        method: 'POST',
        url: '/v3/templates',
        body: {
          name,
          generation: 'dynamic'
        }
      });

      const templateId = response.body.id;

      // Create version for the template
      await sgMail.request({
        method: 'POST',
        url: `/v3/templates/${templateId}/versions`,
        body: {
          name: `${name} - Version 1`,
          subject,
          html_content: htmlContent,
          plain_content: generatePlainContent && !textContent ? this.htmlToText(htmlContent) : textContent,
          active: 1,
          template_id: templateId
        }
      });

      return {
        success: true,
        templateId,
        name
      };
    } catch (error) {
      console.error('SendGrid template creation error:', error);
      
      if (error.response) {
        console.error('SendGrid response body:', error.response.body);
        throw new Error(`SendGrid API error: ${error.response.body?.errors?.[0]?.message || error.message}`);
      }
      
      throw error;
    }
  }

  async getTemplates() {
    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const response = await sgMail.request({
        method: 'GET',
        url: '/v3/templates'
      });

      return {
        success: true,
        templates: response.body.templates
      };
    } catch (error) {
      console.error('SendGrid get templates error:', error);
      
      if (error.response) {
        console.error('SendGrid response body:', error.response.body);
        throw new Error(`SendGrid API error: ${error.response.body?.errors?.[0]?.message || error.message}`);
      }
      
      throw error;
    }
  }

  async validateEmail(email) {
    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const response = await sgMail.request({
        method: 'POST',
        url: '/v3/validations/email',
        body: {
          email
        }
      });

      return {
        success: true,
        isValid: response.body.result?.verdict === 'valid',
        score: response.body.result?.score,
        suggestion: response.body.result?.suggestion
      };
    } catch (error) {
      console.error('SendGrid email validation error:', error);
      
      if (error.response) {
        console.error('SendGrid response body:', error.response.body);
        throw new Error(`SendGrid API error: ${error.response.body?.errors?.[0]?.message || error.message}`);
      }
      
      throw error;
    }
  }

  async getStats(options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const { startDate, endDate, aggregatedBy = 'day' } = options;

      const queryParams = new URLSearchParams({
        aggregated_by: aggregatedBy
      });

      if (startDate) {
        queryParams.append('start_date', startDate);
      }

      if (endDate) {
        queryParams.append('end_date', endDate);
      }

      const response = await sgMail.request({
        method: 'GET',
        url: `/v3/stats?${queryParams.toString()}`
      });

      return {
        success: true,
        stats: response.body
      };
    } catch (error) {
      console.error('SendGrid stats error:', error);
      
      if (error.response) {
        console.error('SendGrid response body:', error.response.body);
        throw new Error(`SendGrid API error: ${error.response.body?.errors?.[0]?.message || error.message}`);
      }
      
      throw error;
    }
  }

  async handleWebhook(eventData) {
    try {
      const events = Array.isArray(eventData) ? eventData : [eventData];
      const processedEvents = [];

      for (const event of events) {
        const processedEvent = {
          messageId: event.sg_message_id,
          event: event.event,
          timestamp: new Date(event.timestamp * 1000),
          email: event.email,
          reason: event.reason,
          response: event.response,
          category: event.category,
          customArgs: event['custom_args'] || {}
        };

        // Add specific event data
        switch (event.event) {
          case 'click':
            processedEvent.clickUrl = event.url;
            processedEvent.ipAddress = event.ip;
            processedEvent.userAgent = event.useragent;
            break;
          case 'open':
            processedEvent.ipAddress = event.ip;
            processedEvent.userAgent = event.useragent;
            break;
          case 'bounce':
            processedEvent.bounceType = event.type;
            processedEvent.status = event.status;
            break;
          case 'spamreport':
            processedEvent.reportedBy = event.reported_by;
            break;
        }

        processedEvents.push(processedEvent);
      }

      return {
        success: true,
        events: processedEvents
      };
    } catch (error) {
      console.error('SendGrid webhook processing error:', error);
      throw error;
    }
  }

  // Utility method to convert HTML to plain text
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Method to send marketing campaign emails with tracking
  async sendCampaignEmail(options) {
    try {
      const {
        to,
        subject,
        html,
        campaignId,
        customerId,
        categories = [],
        customArgs = {}
      } = options;

      // Add campaign tracking
      const campaignCategories = [...categories, `campaign_${campaignId}`];
      const campaignCustomArgs = {
        ...customArgs,
        campaign_id: campaignId,
        customer_id: customerId
      };

      return await this.sendEmail({
        to,
        subject,
        html,
        categories: campaignCategories,
        customArgs: campaignCustomArgs
      });
    } catch (error) {
      console.error('SendGrid campaign email error:', error);
      throw error;
    }
  }

  // Method to send abandoned cart recovery emails
  async sendCartRecoveryEmail(options) {
    try {
      const {
        to,
        customerName,
        cartItems,
        cartValue,
        recoveryLink,
        cartId
      } = options;

      const subject = `Complete your order - Items worth $${cartValue} waiting for you`;
      
      const html = this.generateCartRecoveryHtml({
        customerName,
        cartItems,
        cartValue,
        recoveryLink
      });

      return await this.sendEmail({
        to,
        subject,
        html,
        categories: ['cart_recovery', 'abandoned_cart'],
        customArgs: {
          cart_id: cartId,
          cart_value: cartValue,
          campaign_type: 'cart_recovery'
        }
      });
    } catch (error) {
      console.error('SendGrid cart recovery email error:', error);
      throw error;
    }
  }

  generateCartRecoveryHtml(data) {
    const { customerName, cartItems, cartValue, recoveryLink } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your Order</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .cart-item { border: 1px solid #ddd; margin: 10px 0; padding: 10px; background-color: white; }
          .cta-button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You left something behind! 🛒</h1>
          </div>
          <div class="content">
            <h2>Hi ${customerName || 'there'},</h2>
            <p>Don't miss out on the items you left in your cart. Complete your order before they sell out!</p>
            
            <h3>Your Cart ($${cartValue})</h3>
            ${cartItems.map(item => `
              <div class="cart-item">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.quantity} | Price: $${item.price}</p>
              </div>
            `).join('')}
            
            <div style="text-align: center;">
              <a href="${recoveryLink}" class="cta-button">Complete Your Order</a>
            </div>
            
            <p>This offer expires in 24 hours. Don't wait!</p>
          </div>
          <div class="footer">
            <p>If you didn't add these items to your cart, you can safely ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Your Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = SendGridService;
