const MarketingService = require('../services/marketingService');
const SendGridService = require('../services/sendGridService');
const TwilioService = require('../services/twilioService');

class MarketingWorker {
  constructor() {
    this.marketingService = new MarketingService();
    this.sendGridService = new SendGridService();
    this.twilioService = new TwilioService();
    this.isRunning = false;
    this.pollInterval = 5000; // 5 seconds
  }

  async start() {
    if (this.isRunning) {
      console.log('Marketing worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting marketing worker...');

    while (this.isRunning) {
      try {
        await this.processNextJob();
        await this.sleep(this.pollInterval);
      } catch (error) {
        console.error('Error in marketing worker:', error);
        await this.sleep(this.pollInterval);
      }
    }
  }

  async stop() {
    this.isRunning = false;
    console.log('Marketing worker stopped');
  }

  async processNextJob() {
    try {
      const job = await this.marketingService.getNextJob();
      if (!job) {
        return;
      }

      console.log(`Processing job ${job.id} of type ${job.type}`);

      let success = false;
      let result = null;
      let error = null;

      try {
        switch (job.type) {
          case 'SEND_EMAIL':
            result = await this.processEmailJob(job);
            success = true;
            break;
          case 'SEND_SMS':
            result = await this.processSmsJob(job);
            success = true;
            break;
          case 'PROCESS_ABANDONED_CART':
            result = await this.marketingService.processAbandonedCart(job.data.abandonedCartId);
            success = true;
            break;
          case 'SYNC_SEGMENT':
            result = await this.marketingService.syncCustomerSegment(job.data.segmentId);
            success = true;
            break;
          case 'GENERATE_REPORT':
            result = await this.generateReport(job.data);
            success = true;
            break;
          case 'UPDATE_ANALYTICS':
            result = await this.updateAnalytics(job.data);
            success = true;
            break;
          default:
            throw new Error(`Unknown job type: ${job.type}`);
        }
      } catch (jobError) {
        console.error(`Job ${job.id} failed:`, jobError);
        error = jobError.message;
        success = false;
      }

      await this.marketingService.completeJob(job.id, success, result, error);
      console.log(`Job ${job.id} completed with status: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('Error processing job:', error);
    }
  }

  async processEmailJob(job) {
    const { recipient, template, campaignSettings, type } = job.data;

    try {
      let subject, content, recipientEmail;

      if (type === 'CART_RECOVERY') {
        // Handle abandoned cart recovery email
        const cartTemplate = await this.getCartRecoveryTemplate();
        subject = this.replaceTemplateVariables(cartTemplate.subject, {
          customerName: recipient.name || 'there',
          cartValue: job.data.totalValue
        });
        content = this.replaceTemplateVariables(cartTemplate.content, {
          customerName: recipient.name || 'there',
          cartItems: this.formatCartItems(job.data.cartData),
          cartValue: job.data.totalValue,
          recoveryLink: `${process.env.FRONTEND_URL}/cart/recover?cart=${job.data.cartId}`
        });
        recipientEmail = recipient.email;
      } else {
        // Handle campaign email
        subject = template.subject;
        content = template.content;
        recipientEmail = recipient.email;
      }

      // Send email via SendGrid
      const sendResult = await this.sendGridService.sendEmail({
        to: recipientEmail,
        subject,
        html: content,
        from: campaignSettings?.fromEmail || process.env.SENDGRID_FROM_EMAIL,
        fromName: campaignSettings?.fromName || process.env.SENDGRID_FROM_NAME
      });

      // Track interaction if this is a campaign email
      if (job.data.campaignId) {
        await this.marketingService.trackCampaignInteraction(
          job.data.campaignId,
          recipient.customerId,
          'SENT',
          { messageId: sendResult.messageId }
        );
      }

      return {
        success: true,
        messageId: sendResult.messageId,
        recipient: recipientEmail
      };
    } catch (error) {
      console.error('Error processing email job:', error);
      throw error;
    }
  }

  async processSmsJob(job) {
    const { recipient, template, campaignSettings, type } = job.data;

    try {
      let content, recipientPhone;

      if (type === 'CART_RECOVERY') {
        // Handle abandoned cart recovery SMS
        const smsTemplate = await this.getCartRecoverySmsTemplate();
        content = this.replaceTemplateVariables(smsTemplate.content, {
          customerName: recipient.name || 'there',
          cartValue: job.data.totalValue
        });
        recipientPhone = recipient.phone;
      } else {
        // Handle campaign SMS
        content = template.content;
        recipientPhone = recipient.phone;
      }

      // Send SMS via Twilio
      const sendResult = await this.twilioService.sendSms({
        to: recipientPhone,
        body: content,
        from: campaignSettings?.fromPhone || process.env.TWILIO_PHONE_NUMBER
      });

      // Track interaction if this is a campaign SMS
      if (job.data.campaignId) {
        await this.marketingService.trackCampaignInteraction(
          job.data.campaignId,
          recipient.customerId,
          'SENT',
          { messageId: sendResult.sid }
        );
      }

      return {
        success: true,
        messageId: sendResult.sid,
        recipient: recipientPhone
      };
    } catch (error) {
      console.error('Error processing SMS job:', error);
      throw error;
    }
  }

  async generateReport(data) {
    try {
      const { type, startDate, endDate, filters } = data;

      switch (type) {
        case 'CAMPAIGN_PERFORMANCE':
          return await this.generateCampaignReport(startDate, endDate, filters);
        case 'ABANDONED_CART_ANALYTICS':
          return await this.generateAbandonedCartReport(startDate, endDate, filters);
        case 'CUSTOMER_SEGMENT_ANALYTICS':
          return await this.generateSegmentReport(startDate, endDate, filters);
        default:
          throw new Error(`Unknown report type: ${type}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async generateCampaignReport(startDate, endDate, filters) {
    const campaigns = await this.marketingService.prisma.campaign.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        analytics: true,
        _count: {
          select: {
            interactions: true
          }
        }
      }
    });

    const report = {
      totalCampaigns: campaigns.length,
      totalSent: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
      totalDelivered: campaigns.reduce((sum, c) => sum + c.deliveredCount, 0),
      totalOpened: campaigns.reduce((sum, c) => sum + c.openedCount, 0),
      totalClicked: campaigns.reduce((sum, c) => sum + c.clickedCount, 0),
      totalConverted: campaigns.reduce((sum, c) => sum + c.convertedCount, 0),
      campaigns: campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        metrics: {
          sent: campaign.sentCount,
          delivered: campaign.deliveredCount,
          opened: campaign.openedCount,
          clicked: campaign.clickedCount,
          converted: campaign.convertedCount,
          openRate: campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount) * 100 : 0,
          clickRate: campaign.deliveredCount > 0 ? (campaign.clickedCount / campaign.deliveredCount) * 100 : 0,
          conversionRate: campaign.clickedCount > 0 ? (campaign.convertedCount / campaign.clickedCount) * 100 : 0
        }
      }))
    };

    return report;
  }

  async generateAbandonedCartReport(startDate, endDate, filters) {
    const abandonedCarts = await this.marketingService.prisma.abandonedCart.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalAbandoned = abandonedCarts.length;
    const totalRecovered = abandonedCarts.filter(cart => cart.recoveredAt).length;
    const totalValue = abandonedCarts.reduce((sum, cart) => sum + parseFloat(cart.totalValue), 0);
    const recoveredValue = abandonedCarts
      .filter(cart => cart.recoveredAt)
      .reduce((sum, cart) => sum + parseFloat(cart.totalValue), 0);

    return {
      totalAbandoned,
      totalRecovered,
      recoveryRate: totalAbandoned > 0 ? (totalRecovered / totalAbandoned) * 100 : 0,
      totalValue,
      recoveredValue,
      recoveryValueRate: totalValue > 0 ? (recoveredValue / totalValue) * 100 : 0,
      averageCartValue: totalAbandoned > 0 ? totalValue / totalAbandoned : 0
    };
  }

  async generateSegmentReport(startDate, endDate, filters) {
    const segments = await this.marketingService.prisma.customerSegment.findMany({
      where: {
        ...(filters?.isActive && { isActive: filters.isActive })
      },
      include: {
        _count: {
          select: {
            customers: true,
            campaigns: true
          }
        }
      }
    });

    return {
      totalSegments: segments.length,
      totalCustomers: segments.reduce((sum, s) => sum + s._count.customers, 0),
      segments: segments.map(segment => ({
        id: segment.id,
        name: segment.name,
        customerCount: segment._count.customers,
        campaignCount: segment._count.campaigns,
        isDynamic: segment.isDynamic,
        lastSyncedAt: segment.lastSyncedAt
      }))
    };
  }

  async updateAnalytics(data) {
    try {
      const { type, entityId, metrics } = data;

      switch (type) {
        case 'CAMPAIGN_METRICS':
          await this.updateCampaignAnalytics(entityId, metrics);
          break;
        case 'DASHBOARD_METRICS':
          await this.updateDashboardMetrics(metrics);
          break;
        default:
          throw new Error(`Unknown analytics update type: ${type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating analytics:', error);
      throw error;
    }
  }

  async updateCampaignAnalytics(campaignId, metrics) {
    const today = new Date().toISOString().split('T')[0];

    for (const [metric, value] of Object.entries(metrics)) {
      await this.marketingService.prisma.campaignAnalytics.upsert({
        where: {
          campaignId_date_metric: {
            campaignId,
            date: new Date(today),
            metric
          }
        },
        update: {
          value: { increment: value }
        },
        create: {
          campaignId,
          date: new Date(today),
          metric,
          value
        }
      });
    }
  }

  async updateDashboardMetrics(metrics) {
    // Cache dashboard metrics in Redis for quick access
    await this.marketingService.connectRedis();
    await this.marketingService.redis.setEx(
      'dashboard:metrics',
      300, // 5 minutes
      JSON.stringify({
        ...metrics,
        updatedAt: new Date()
      })
    );
  }

  // Helper methods
  async getCartRecoveryTemplate() {
    // This would typically come from database or configuration
    return {
      subject: 'You left something in your cart! 🛒',
      content: `
        <h2>Don't miss out!</h2>
        <p>Hi {{customerName}},</p>
        <p>You left items worth ${{cartValue}} in your cart. Complete your purchase before they sell out!</p>
        <a href="{{recoveryLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Complete Your Order
        </a>
        <p>Your cart:</p>
        {{cartItems}}
      `
    };
  }

  async getCartRecoverySmsTemplate() {
    return {
      content: 'Hi {{customerName}}! You left items worth ${{cartValue}} in your cart. Complete your order before they sell out! {{recoveryLink}}'
    };
  }

  replaceTemplateVariables(content, variables) {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  formatCartItems(cartData) {
    if (!cartData || !cartData.items) {
      return '<p>No items in cart</p>';
    }

    return cartData.items.map(item => `
      <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd;">
        <h4>${item.name}</h4>
        <p>Quantity: ${item.quantity} | Price: $${item.price}</p>
      </div>
    `).join('');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start worker if this file is run directly
if (require.main === module) {
  const worker = new MarketingWorker();
  worker.start().catch(console.error);
}

module.exports = MarketingWorker;
