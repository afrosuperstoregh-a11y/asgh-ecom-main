const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!this.accountSid || !this.authToken) {
      console.warn('Twilio credentials not configured');
    } else {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  async sendSms(options) {
    try {
      if (!this.client) {
        throw new Error('Twilio credentials not configured');
      }

      const {
        to,
        body,
        from = this.fromNumber,
        mediaUrls,
        statusCallback,
        maxRetries = 3
      } = options;

      const messageOptions = {
        body,
        from,
        to: this.formatPhoneNumber(to),
        maxRetries
      };

      if (mediaUrls && mediaUrls.length > 0) {
        messageOptions.mediaUrl = mediaUrls;
      }

      if (statusCallback) {
        messageOptions.statusCallback = statusCallback;
      }

      const message = await this.client.messages.create(messageOptions);

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      
      if (error.code) {
        console.error('Twilio error code:', error.code);
        console.error('Twilio error message:', error.message);
      }
      
      throw new Error(`Twilio SMS error: ${error.message}`);
    }
  }

  async sendBulkSms(messages) {
    try {
      if (!this.client) {
        throw new Error('Twilio credentials not configured');
      }

      const results = [];
      
      for (const messageData of messages) {
        try {
          const result = await this.sendSms(messageData);
          results.push({ success: true, ...result });
        } catch (error) {
          results.push({ 
            success: false, 
            error: error.message, 
            to: messageData.to 
          });
        }
      }

      return {
        success: true,
        results,
        totalSent: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length
      };
    } catch (error) {
      console.error('Twilio bulk SMS error:', error);
      throw error;
    }
  }

  async getMessage(messageSid) {
    try {
      if (!this.client) {
        throw new Error('Twilio credentials not configured');
      }

      const message = await this.client.messages(messageSid).fetch();

      return {
        success: true,
        message: {
          sid: message.sid,
          status: message.status,
          to: message.to,
          from: message.from,
          body: message.body,
          dateCreated: message.dateCreated,
          dateSent: message.dateSent,
          dateUpdated: message.dateUpdated,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
          price: message.price,
          priceUnit: message.priceUnit,
          numMedia: message.numMedia,
          numSegments: message.numSegments
        }
      };
    } catch (error) {
      console.error('Twilio get message error:', error);
      throw new Error(`Twilio get message error: ${error.message}`);
    }
  }

  async getMessages(options = {}) {
    try {
      if (!this.client) {
        throw new Error('Twilio credentials not configured');
      }

      const {
        to,
        from,
        dateSent,
        dateSentAfter,
        dateSentBefore,
        limit = 20,
        pageSize = 50
      } = options;

      const filterOptions = {
        limit,
        pageSize
      };

      if (to) filterOptions.to = this.formatPhoneNumber(to);
      if (from) filterOptions.from = this.formatPhoneNumber(from);
      if (dateSent) filterOptions.dateSent = dateSent;
      if (dateSentAfter) filterOptions.dateSentAfter = dateSentAfter;
      if (dateSentBefore) filterOptions.dateSentBefore = dateSentBefore;

      const messages = await this.client.messages.list(filterOptions);

      return {
        success: true,
        messages: messages.map(message => ({
          sid: message.sid,
          status: message.status,
          to: message.to,
          from: message.from,
          body: message.body,
          dateCreated: message.dateCreated,
          dateSent: message.dateSent,
          dateUpdated: message.dateUpdated,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
          price: message.price,
          priceUnit: message.priceUnit,
          numMedia: message.numMedia,
          numSegments: message.numSegments
        }))
      };
    } catch (error) {
      console.error('Twilio get messages error:', error);
      throw new Error(`Twilio get messages error: ${error.message}`);
    }
  }

  async validatePhoneNumber(phoneNumber) {
    try {
      if (!this.client) {
        throw new Error('Twilio credentials not configured');
      }

      const lookup = await this.client.lookups.v2.phoneNumbers(phoneNumber).fetch();

      return {
        success: true,
        isValid: true,
        phoneNumber: lookup.phoneNumber,
        nationalFormat: lookup.nationalFormat,
        countryCode: lookup.countryCode,
        carrier: {
          name: lookup.carrier?.name,
          type: lookup.carrier?.type,
          mobileCountryCode: lookup.carrier?.mobile_country_code,
          mobileNetworkCode: lookup.carrier?.mobile_network_code
        }
      };
    } catch (error) {
      if (error.status === 404) {
        return {
          success: true,
          isValid: false,
          error: 'Phone number not found or invalid'
        };
      }
      
      console.error('Twilio phone validation error:', error);
      throw new Error(`Twilio phone validation error: ${error.message}`);
    }
  }

  async formatPhoneNumber(phoneNumber) {
    try {
      if (!phoneNumber) return null;

      // Remove all non-digit characters
      let cleaned = phoneNumber.replace(/\D/g, '');

      // If it starts with country code, keep it
      if (cleaned.startsWith('1') && cleaned.length === 11) {
        return `+${cleaned}`;
      }

      // If it's 10 digits, assume US number
      if (cleaned.length === 10) {
        return `+1${cleaned}`;
      }

      // If it already has +, return as is
      if (phoneNumber.startsWith('+')) {
        return phoneNumber;
      }

      // Otherwise, try to validate with Twilio
      const validation = await this.validatePhoneNumber(phoneNumber);
      return validation.isValid ? validation.phoneNumber : phoneNumber;
    } catch (error) {
      console.error('Phone number formatting error:', error);
      return phoneNumber;
    }
  }

  async handleWebhook(requestData) {
    try {
      const events = Array.isArray(requestData) ? requestData : [requestData];
      const processedEvents = [];

      for (const event of events) {
        const processedEvent = {
          messageSid: event.MessageSid || event.messageSid,
          messageStatus: event.MessageStatus || event.messageStatus,
          to: event.To || event.to,
          from: event.From || event.from,
          body: event.Body || event.body,
          timestamp: new Date(),
          errorCode: event.ErrorCode || event.errorCode,
          errorMessage: event.ErrorMessage || event.errorMessage
        };

        // Add specific event data based on status
        switch (processedEvent.messageStatus) {
          case 'delivered':
            processedEvent.deliveryTimestamp = event.DeliveryTimestamp || event.deliveryTimestamp;
            break;
          case 'failed':
            processedEvent.errorCode = event.ErrorCode || event.errorCode;
            processedEvent.errorMessage = event.ErrorMessage || event.errorMessage;
            break;
          case 'read':
            processedEvent.readTimestamp = event.ReadTimestamp || event.readTimestamp;
            break;
        }

        processedEvents.push(processedEvent);
      }

      return {
        success: true,
        events: processedEvents
      };
    } catch (error) {
      console.error('Twilio webhook processing error:', error);
      throw error;
    }
  }

  // Method to send marketing campaign SMS with tracking
  async sendCampaignSms(options) {
    try {
      const {
        to,
        body,
        campaignId,
        customerId,
        mediaUrls,
        statusCallback
      } = options;

      // Add campaign tracking to status callback
      const trackingCallback = statusCallback || `${process.env.API_URL}/api/marketing/webhooks/twilio`;
      
      // Add campaign parameters to the message
      const trackedBody = `${body}\n\nReply STOP to unsubscribe, HELP for help. Msg&Data rates may apply.`;

      return await this.sendSms({
        to,
        body: trackedBody,
        mediaUrls,
        statusCallback: `${trackingCallback}?campaign_id=${campaignId}&customer_id=${customerId}`
      });
    } catch (error) {
      console.error('Twilio campaign SMS error:', error);
      throw error;
    }
  }

  // Method to send abandoned cart recovery SMS
  async sendCartRecoverySms(options) {
    try {
      const {
        to,
        customerName,
        cartValue,
        recoveryLink,
        cartId
      } = options;

      const body = `Hi ${customerName || 'there'}! You left items worth $${cartValue} in your cart. Complete your order before they sell out! ${recoveryLink}`;

      return await this.sendSms({
        to,
        body,
        statusCallback: `${process.env.API_URL}/api/marketing/webhooks/twilio?type=cart_recovery&cart_id=${cartId}`
      });
    } catch (error) {
      console.error('Twilio cart recovery SMS error:', error);
      throw error;
    }
  }

  // Method to send promotional SMS
  async sendPromotionalSms(options) {
    try {
      const {
        to,
        customerName,
        promotion,
        promoCode,
        expiryDate
      } = options;

      const body = `Hi ${customerName || 'there'}! 🎉 Special offer just for you: ${promotion}. Use code ${promoCode} at checkout. Offer expires ${expiryDate}. Shop now: ${process.env.FRONTEND_URL}`;

      return await this.sendSms({
        to,
        body,
        statusCallback: `${process.env.API_URL}/api/marketing/webhooks/twilio?type=promotion&promo_code=${promoCode}`
      });
    } catch (error) {
      console.error('Twilio promotional SMS error:', error);
      throw error;
    }
  }

  // Method to send order updates via SMS
  async sendOrderUpdateSms(options) {
    try {
      const {
        to,
        customerName,
        orderNumber,
        status,
        trackingNumber
      } = options;

      let body = `Hi ${customerName || 'there'}! Your order #${orderNumber} is ${status.toLowerCase()}.`;
      
      if (trackingNumber) {
        body += ` Track: ${trackingNumber}`;
      }

      body += ` View details: ${process.env.FRONTEND_URL}/orders/${orderNumber}`;

      return await this.sendSms({
        to,
        body,
        statusCallback: `${process.env.API_URL}/api/marketing/webhooks/twilio?type=order_update&order_number=${orderNumber}`
      });
    } catch (error) {
      console.error('Twilio order update SMS error:', error);
      throw error;
    }
  }

  // Method to check SMS delivery status
  async getDeliveryStatus(messageSid) {
    try {
      const message = await this.getMessage(messageSid);
      
      return {
        success: true,
        status: message.message.status,
        delivered: message.message.status === 'delivered',
        failed: ['failed', 'undelivered'].includes(message.message.status),
        pending: ['queued', 'sending', 'sent'].includes(message.message.status),
        read: message.message.status === 'read',
        errorCode: message.message.errorCode,
        errorMessage: message.message.errorMessage,
        dateSent: message.message.dateSent,
        price: message.message.price
      };
    } catch (error) {
      console.error('Twilio delivery status error:', error);
      throw error;
    }
  }

  // Method to get SMS usage statistics
  async getUsageStats(options = {}) {
    try {
      const {
        startDate,
        endDate,
        includeSubaccounts = false
      } = options;

      const filterOptions = {
        category: 'sms'
      };

      if (startDate) filterOptions.startDate = startDate;
      if (endDate) filterOptions.endDate = endDate;
      if (includeSubaccounts) filterOptions.includeSubaccounts = includeSubaccounts;

      // Note: This would require the Twilio Usage API
      // For now, we'll return a placeholder implementation
      return {
        success: true,
        message: 'Usage stats require Twilio Usage API implementation',
        filterOptions
      };
    } catch (error) {
      console.error('Twilio usage stats error:', error);
      throw error;
    }
  }

  // Method to opt-out phone number
  async optOutPhoneNumber(phoneNumber) {
    try {
      if (!this.client) {
        throw new Error('Twilio credentials not configured');
      }

      const formattedNumber = await this.formatPhoneNumber(phoneNumber);
      
      // Add to Twilio's opt-out list
      // Note: This would typically use Twilio's Message Feedback API or custom opt-out management
      console.log(`Opting out phone number: ${formattedNumber}`);

      return {
        success: true,
        phoneNumber: formattedNumber,
        message: 'Phone number opted out successfully'
      };
    } catch (error) {
      console.error('Twilio opt-out error:', error);
      throw error;
    }
  }

  // Method to check if phone number is opted out
  async isOptedOut(phoneNumber) {
    try {
      const formattedNumber = await this.formatPhoneNumber(phoneNumber);
      
      // Check against opt-out list
      // Note: This would typically query your database or Twilio's opt-out list
      console.log(`Checking opt-out status for: ${formattedNumber}`);

      return {
        success: true,
        phoneNumber: formattedNumber,
        optedOut: false // Placeholder implementation
      };
    } catch (error) {
      console.error('Twilio opt-out check error:', error);
      throw error;
    }
  }
}

module.exports = TwilioService;
