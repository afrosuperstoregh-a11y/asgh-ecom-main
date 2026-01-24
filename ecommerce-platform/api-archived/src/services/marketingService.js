const { PrismaClient } = require('@prisma/client');
const Redis = require('redis');

class MarketingService {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.redis.on('error', (err) => console.error('Redis Client Error:', err));
  }

  async connectRedis() {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  async createCampaign(campaignData) {
    try {
      const campaign = await this.prisma.campaign.create({
        data: {
          ...campaignData,
          totalRecipients: 0,
          sentCount: 0,
          deliveredCount: 0,
          openedCount: 0,
          clickedCount: 0,
          convertedCount: 0
        },
        include: {
          template: true,
          segment: true
        }
      });

      // Cache campaign for quick access
      await this.connectRedis();
      await this.redis.setEx(`campaign:${campaign.id}`, 3600, JSON.stringify(campaign));

      return campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getCampaignRecipients(campaignId) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { segment: true }
      });

      if (!campaign.segmentId) {
        throw new Error('Campaign has no segment specified');
      }

      // Get customers from segment
      const segmentMembers = await this.prisma.customerSegmentMembership.findMany({
        where: { segmentId: campaign.segmentId },
        include: {
          customer: {
            include: {
              subscriptions: true
            }
          }
        }
      });

      // Filter by subscription preferences based on campaign type
      const recipients = segmentMembers
        .filter(member => {
          if (campaign.type === 'EMAIL') {
            return member.customer.email && 
                   member.customer.subscriptions.some(sub => sub.emailSubscribed);
          } else if (campaign.type === 'SMS') {
            return member.customer.phone && 
                   member.customer.subscriptions.some(sub => sub.smsSubscribed);
          }
          return false;
        })
        .map(member => ({
          customerId: member.customer.id,
          email: member.customer.email,
          phone: member.customer.phone,
          name: member.customer.name
        }));

      // Update campaign recipient count
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { totalRecipients: recipients.length }
      });

      return recipients;
    } catch (error) {
      console.error('Error getting campaign recipients:', error);
      throw error;
    }
  }

  async sendCampaign(campaignId, options = {}) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          template: true,
          segment: true
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (!campaign.template) {
        throw new Error('Campaign has no template');
      }

      // Get recipients
      const recipients = options.testEmails 
        ? options.testEmails.map(email => ({ email, name: 'Test User' }))
        : await this.getCampaignRecipients(campaignId);

      if (recipients.length === 0) {
        throw new Error('No recipients found for campaign');
      }

      // Update campaign status
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENDING',
          sentAt: new Date()
        }
      });

      // Create individual send jobs for each recipient
      const jobs = recipients.map(recipient => ({
        type: campaign.type === 'EMAIL' ? 'SEND_EMAIL' : 'SEND_SMS',
        status: 'PENDING',
        priority: 'NORMAL',
        data: {
          campaignId,
          recipient,
          template: campaign.template,
          campaignSettings: campaign.settings
        }
      }));

      // Batch insert jobs
      await this.prisma.marketingJob.createMany({
        data: jobs
      });

      // Update campaign sent count
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { sentCount: recipients.length }
      });

      return {
        success: true,
        recipientsCount: recipients.length,
        jobsCreated: jobs.length
      };
    } catch (error) {
      console.error('Error sending campaign:', error);
      
      // Update campaign status to failed
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'CANCELLED' }
      });
      
      throw error;
    }
  }

  // ==================== CUSTOMER SEGMENTATION ====================

  async syncCustomerSegment(segmentId) {
    try {
      const segment = await this.prisma.customerSegment.findUnique({
        where: { id: segmentId }
      });

      if (!segment) {
        throw new Error('Segment not found');
      }

      // Clear existing memberships for dynamic segments
      if (segment.isDynamic) {
        await this.prisma.customerSegmentMembership.deleteMany({
          where: { segmentId }
        });
      }

      // Apply segment rules to get matching customers
      const matchingCustomers = await this.applySegmentRules(segment.rules);

      // Create memberships
      const memberships = matchingCustomers.map(customerId => ({
        segmentId,
        customerId
      }));

      if (memberships.length > 0) {
        await this.prisma.customerSegmentMembership.createMany({
          data: memberships,
          skipDuplicates: true
        });
      }

      // Update segment customer count and last synced time
      await this.prisma.customerSegment.update({
        where: { id: segmentId },
        data: {
          customerCount: memberships.length,
          lastSyncedAt: new Date()
        }
      });

      // Cache segment data
      await this.connectRedis();
      await this.redis.setEx(`segment:${segmentId}`, 1800, JSON.stringify({
        customerCount: memberships.length,
        lastSyncedAt: new Date()
      }));

      return {
        success: true,
        customerCount: memberships.length
      };
    } catch (error) {
      console.error('Error syncing customer segment:', error);
      throw error;
    }
  }

  async applySegmentRules(rules) {
    try {
      // This is a simplified implementation
      // In a real-world scenario, you'd have more sophisticated rule processing
      const { conditions, operator = 'AND' } = rules;

      let whereClause = {};

      // Build where clause based on rules
      conditions.forEach(condition => {
        const { field, operator: op, value } = condition;
        
        switch (field) {
          case 'totalSpent':
            whereClause.orders = {
              some: {
                total: this.buildPrismaOperator(op, value)
              }
            };
            break;
          case 'orderCount':
            whereClause.orders = {
              some: {}
            };
            break;
          case 'lastOrderDate':
            whereClause.orders = {
              some: {
                createdAt: this.buildPrismaOperator(op, new Date(value))
              }
            };
            break;
          case 'registeredAfter':
            whereClause.createdAt = this.buildPrismaOperator(op, new Date(value));
            break;
          case 'hasPurchasedCategory':
            whereClause.orders = {
              some: {
                items: {
                  some: {
                    product: {
                      categoryId: value
                    }
                  }
                }
              }
            };
            break;
          default:
            // Handle custom fields
            whereClause[field] = this.buildPrismaOperator(op, value);
        }
      });

      const customers = await this.prisma.user.findMany({
        where: whereClause,
        select: { id: true }
      });

      return customers.map(customer => customer.id);
    } catch (error) {
      console.error('Error applying segment rules:', error);
      throw error;
    }
  }

  buildPrismaOperator(operator, value) {
    switch (operator) {
      case 'gt':
        return { gt: value };
      case 'gte':
        return { gte: value };
      case 'lt':
        return { lt: value };
      case 'lte':
        return { lte: value };
      case 'equals':
        return { equals: value };
      case 'contains':
        return { contains: value };
      case 'in':
        return { in: value };
      default:
        return { equals: value };
    }
  }

  // ==================== ABANDONED CART RECOVERY ====================

  async processAbandonedCart(abandonedCartId) {
    try {
      const abandonedCart = await this.prisma.abandonedCart.findUnique({
        where: { id: abandonedCartId }
      });

      if (!abandonedCart) {
        throw new Error('Abandoned cart not found');
      }

      if (abandonedCart.recoveredAt) {
        return { success: false, message: 'Cart already recovered' };
      }

      // Check if enough time has passed
      const hoursSinceAbandonment = (Date.now() - abandonedCart.createdAt) / (1000 * 60 * 60);
      if (hoursSinceAbandonment < 1) {
        return { success: false, message: 'Too soon to send recovery' };
      }

      // Determine which recovery method to use
      const recoverySent = await this.sendCartRecovery(abandonedCart);

      // Update abandoned cart
      await this.prisma.abandonedCart.update({
        where: { id: abandonedCartId },
        data: {
          recoveryEmailSent: recoverySent.email,
          recoverySmsSent: recoverySent.sms,
          recoveryCount: abandonedCart.recoveryCount + 1
        }
      });

      return {
        success: true,
        emailSent: recoverySent.email,
        smsSent: recoverySent.sms
      };
    } catch (error) {
      console.error('Error processing abandoned cart:', error);
      throw error;
    }
  }

  async sendCartRecovery(abandonedCart) {
    const result = { email: false, sms: false };

    try {
      // Send email recovery
      if (abandonedCart.email && !abandonedCart.recoveryEmailSent) {
        const emailJob = await this.prisma.marketingJob.create({
          data: {
            type: 'SEND_EMAIL',
            status: 'PENDING',
            priority: 'HIGH',
            data: {
              type: 'CART_RECOVERY',
              recipient: { email: abandonedCart.email },
              cartData: abandonedCart.cartData,
              totalValue: abandonedCart.totalValue
            }
          }
        });
        result.email = true;
      }

      // Send SMS recovery
      if (abandonedCart.phone && !abandonedCart.recoverySmsSent) {
        const smsJob = await this.prisma.marketingJob.create({
          data: {
            type: 'SEND_SMS',
            status: 'PENDING',
            priority: 'HIGH',
            data: {
              type: 'CART_RECOVERY',
              recipient: { phone: abandonedCart.phone },
              cartData: abandonedCart.cartData,
              totalValue: abandonedCart.totalValue
            }
          }
        });
        result.sms = true;
      }
    } catch (error) {
      console.error('Error sending cart recovery:', error);
    }

    return result;
  }

  // ==================== ANALYTICS ====================

  async trackCampaignInteraction(campaignId, customerId, type, data = {}) {
    try {
      const interaction = await this.prisma.campaignInteraction.create({
        data: {
          campaignId,
          customerId,
          type,
          data,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });

      // Update campaign counters
      const updateData = {};
      switch (type) {
        case 'DELIVERED':
          updateData.deliveredCount = { increment: 1 };
          break;
        case 'OPENED':
          updateData.openedCount = { increment: 1 };
          break;
        case 'CLICKED':
          updateData.clickedCount = { increment: 1 };
          break;
        case 'CONVERTED':
          updateData.convertedCount = { increment: 1 };
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: updateData
        });
      }

      // Update daily analytics
      const today = new Date().toISOString().split('T')[0];
      await this.prisma.campaignAnalytics.upsert({
        where: {
          campaignId_date_metric: {
            campaignId,
            date: new Date(today),
            metric: type.toLowerCase()
          }
        },
        update: {
          value: { increment: 1 },
          revenue: type === 'CONVERTED' ? { increment: data.revenue || 0 } : undefined
        },
        create: {
          campaignId,
          date: new Date(today),
          metric: type.toLowerCase(),
          value: 1,
          revenue: type === 'CONVERTED' ? data.revenue || 0 : 0
        }
      });

      return interaction;
    } catch (error) {
      console.error('Error tracking campaign interaction:', error);
      throw error;
    }
  }

  async getCampaignMetrics(campaignId, startDate, endDate) {
    try {
      const where = { campaignId };
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      const analytics = await this.prisma.campaignAnalytics.findMany({
        where,
        orderBy: { date: 'asc' }
      });

      // Calculate metrics
      const metrics = {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalConverted: 0,
        totalRevenue: 0,
        dailyData: analytics
      };

      analytics.forEach(item => {
        switch (item.metric) {
          case 'sent':
            metrics.totalSent += item.value;
            break;
          case 'delivered':
            metrics.totalDelivered += item.value;
            break;
          case 'opened':
            metrics.totalOpened += item.value;
            break;
          case 'clicked':
            metrics.totalClicked += item.value;
            break;
          case 'converted':
            metrics.totalConverted += item.value;
            metrics.totalRevenue += parseFloat(item.revenue);
            break;
        }
      });

      // Calculate rates
      metrics.openRate = metrics.totalSent > 0 ? (metrics.totalOpened / metrics.totalSent) * 100 : 0;
      metrics.clickRate = metrics.totalDelivered > 0 ? (metrics.totalClicked / metrics.totalDelivered) * 100 : 0;
      metrics.conversionRate = metrics.totalClicked > 0 ? (metrics.totalConverted / metrics.totalClicked) * 100 : 0;
      metrics.deliveryRate = metrics.totalSent > 0 ? (metrics.totalDelivered / metrics.totalSent) * 100 : 0;

      return metrics;
    } catch (error) {
      console.error('Error getting campaign metrics:', error);
      throw error;
    }
  }

  // ==================== JOB PROCESSING ====================

  async getNextJob(priority = null) {
    try {
      const where = { status: 'PENDING' };
      if (priority) {
        where.priority = priority;
      }

      const job = await this.prisma.marketingJob.findFirst({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      });

      if (job) {
        // Mark job as processing
        await this.prisma.marketingJob.update({
          where: { id: job.id },
          data: {
            status: 'PROCESSING',
            startedAt: new Date()
          }
        });
      }

      return job;
    } catch (error) {
      console.error('Error getting next job:', error);
      throw error;
    }
  }

  async completeJob(jobId, success, result = null, error = null) {
    try {
      const updateData = {
        status: success ? 'COMPLETED' : 'FAILED',
        completedAt: new Date(),
        attempts: { increment: 1 }
      };

      if (result) {
        updateData.result = result;
      }

      if (error) {
        updateData.error = error;
      }

      await this.prisma.marketingJob.update({
        where: { id: jobId },
        data: updateData
      });
    } catch (error) {
      console.error('Error completing job:', error);
      throw error;
    }
  }

  async retryFailedJobs() {
    try {
      const failedJobs = await this.prisma.marketingJob.findMany({
        where: {
          status: 'FAILED',
          attempts: { lt: 3 }
        }
      });

      for (const job of failedJobs) {
        await this.prisma.marketingJob.update({
          where: { id: job.id },
          data: {
            status: 'PENDING',
            error: null
          }
        });
      }

      return failedJobs.length;
    } catch (error) {
      console.error('Error retrying failed jobs:', error);
      throw error;
    }
  }
}

module.exports = MarketingService;
