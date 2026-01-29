/**
 * Email Service Layer
 * Centralized email communication service with template management and delivery
 */

const nodemailer = require('nodemailer');
const { supabase } = require('../config/supabase');
const { Pool } = require('pg');

// Fallback PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class EmailService {
  constructor() {
    this.useSupabase = !!supabase;
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  async initializeTransporter() {
    try {
      // Configure transporter based on provider
      const provider = process.env.EMAIL_PROVIDER || 'smtp';
      
      if (provider === 'resend') {
        // Resend configuration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.RESEND_API_KEY,
            pass: process.env.RESEND_API_KEY
          }
        });
      } else if (provider === 'sendgrid') {
        // SendGrid configuration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      } else {
        // Default SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      }

      // Verify transporter
      await this.transporter.verify();
      console.log('✅ Email transporter initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  /**
   * Template Management Methods
   */

  // Get email template
  async getTemplate(templateIdOrName) {
    try {
      if (this.useSupabase) {
        let query = supabase.from('email_templates').select('*');
        
        // Check if parameter is UUID or name
        if (templateIdOrName.includes('-')) {
          query = query.eq('id', templateIdOrName);
        } else {
          query = query.eq('name', templateIdOrName);
        }

        const { data, error } = await query.single();
        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const isUUID = templateIdOrName.includes('-');
        const field = isUUID ? 'id' : 'name';
        
        const query = `SELECT * FROM email_templates WHERE ${field} = $1 AND is_active = true`;
        const result = await pool.query(query, [templateIdOrName]);
        return result.rows[0] || null;
      }
    } catch (error) {
      console.error('Error getting email template:', error);
      throw error;
    }
  }

  // Create email template
  async createTemplate(templateData) {
    try {
      const {
        name,
        subject,
        html_content,
        text_content,
        template_type,
        category,
        variables = [],
        created_by
      } = templateData;

      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            name,
            subject,
            html_content,
            text_content,
            template_type,
            category,
            variables,
            created_by
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO email_templates (
            name, subject, html_content, text_content, template_type, 
            category, variables, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        const result = await pool.query(query, [
          name, subject, html_content, text_content, template_type,
          category, JSON.stringify(variables), created_by
        ]);

        return result.rows[0];
      }
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }

  // Update email template
  async updateTemplate(templateId, updates) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('email_templates')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const setClause = Object.keys(updates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');

        const query = `
          UPDATE email_templates 
          SET ${setClause}, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;

        const values = [templateId, ...Object.values(updates)];
        const result = await pool.query(query, values);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  }

  /**
   * Email Sending Methods
   */

  // Send email using template
  async sendEmail(options) {
    try {
      const {
        to,
        templateIdOrName,
        variables = {},
        customerId = null,
        attachments = [],
        priority = 'normal'
      } = options;

      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      // Get template
      const template = await this.getTemplate(templateIdOrName);
      if (!template) {
        throw new Error(`Email template not found: ${templateIdOrName}`);
      }

      // Process template variables
      const processedSubject = this.processTemplate(template.subject, variables);
      const processedHtml = this.processTemplate(template.html_content, variables);
      const processedText = template.text_content 
        ? this.processTemplate(template.text_content, variables)
        : null;

      // Create email log entry
      const logData = {
        template_id: template.id,
        customer_id: customerId,
        recipient_email: Array.isArray(to) ? to.join(', ') : to,
        subject: processedSubject,
        content: processedHtml,
        status: 'pending',
        provider: process.env.EMAIL_PROVIDER || 'smtp'
      };

      let emailLog;
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('email_logs')
          .insert(logData)
          .select()
          .single();

        if (error) throw error;
        emailLog = data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO email_logs (template_id, customer_id, recipient_email, subject, content, status, provider)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const result = await pool.query(query, [
          template.id, customerId, logData.recipient_email, 
          processedSubject, processedHtml, 'pending', logData.provider
        ]);
        emailLog = result.rows[0];
      }

      // Send email
      try {
        const mailOptions = {
          from: {
            name: process.env.EMAIL_FROM_NAME || 'Afro Superstore',
            address: process.env.EMAIL_FROM_ADDRESS || 'noreply@afrosuperstore.ca'
          },
          to: Array.isArray(to) ? to.join(', ') : to,
          subject: processedSubject,
          html: processedHtml,
          text: processedText,
          attachments,
          priority
        };

        const result = await this.transporter.sendMail(mailOptions);

        // Update email log with success
        await this.updateEmailLog(emailLog.id, {
          status: 'sent',
          provider_id: result.messageId,
          sent_at: new Date().toISOString()
        });

        return {
          success: true,
          messageId: result.messageId,
          logId: emailLog.id
        };
      } catch (sendError) {
        // Update email log with error
        await this.updateEmailLog(emailLog.id, {
          status: 'failed',
          error_message: sendError.message
        });

        throw sendError;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Send transactional email (common templates)
  async sendTransactionalEmail(type, recipient, variables = {}) {
    try {
      const templateMap = {
        'order_confirmation': 'Order Confirmation',
        'shipping_confirmation': 'Shipping Confirmation',
        'delivery_confirmation': 'Delivery Confirmation',
        'refund_confirmation': 'Refund Confirmation',
        'welcome': 'Welcome Email',
        'password_reset': 'Password Reset'
      };

      const templateName = templateMap[type];
      if (!templateName) {
        throw new Error(`Unknown transactional email type: ${type}`);
      }

      return await this.sendEmail({
        to: recipient.email,
        templateIdOrName: templateName,
        variables: {
          customer_name: `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || 'Customer',
          customer_email: recipient.email,
          ...variables
        },
        customerId: recipient.customer_id
      });
    } catch (error) {
      console.error('Error sending transactional email:', error);
      throw error;
    }
  }

  // Send marketing email
  async sendMarketingEmail(options) {
    try {
      const {
        recipients, // Array of customer objects or emails
        campaignId = null,
        templateIdOrName,
        variables = {},
        scheduleAt = null
      } = options;

      if (scheduleAt && new Date(scheduleAt) > new Date()) {
        // Schedule email for later
        return await this.scheduleEmail({
          ...options,
          scheduled_at: scheduleAt
        });
      }

      const results = [];
      
      for (const recipient of recipients) {
        try {
          const result = await this.sendEmail({
            to: typeof recipient === 'string' ? recipient : recipient.email,
            templateIdOrName,
            variables: {
              customer_name: recipient.first_name ? `${recipient.first_name} ${recipient.last_name || ''}`.trim() : 'Customer',
              customer_email: typeof recipient === 'string' ? recipient : recipient.email,
              ...variables
            },
            customerId: typeof recipient === 'string' ? null : recipient.customer_id
          });

          results.push({
            recipient: typeof recipient === 'string' ? recipient : recipient.email,
            success: true,
            messageId: result.messageId,
            logId: result.logId
          });
        } catch (error) {
          results.push({
            recipient: typeof recipient === 'string' ? recipient : recipient.email,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending marketing email:', error);
      throw error;
    }
  }

  /**
   * Email Campaign Methods
   */

  // Create email campaign
  async createCampaign(campaignData) {
    try {
      const {
        name,
        subject,
        content,
        template_id,
        segment_id,
        scheduled_at,
        created_by
      } = campaignData;

      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('email_campaigns')
          .insert({
            name,
            subject,
            content,
            template_id,
            segment_id,
            status: scheduled_at ? 'scheduled' : 'draft',
            scheduled_at,
            created_by
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO email_campaigns (
            name, subject, content, template_id, segment_id, 
            status, scheduled_at, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        const result = await pool.query(query, [
          name, subject, content, template_id, segment_id,
          scheduled_at ? 'scheduled' : 'draft', scheduled_at, created_by
        ]);

        return result.rows[0];
      }
    } catch (error) {
      console.error('Error creating email campaign:', error);
      throw error;
    }
  }

  // Launch email campaign
  async launchCampaign(campaignId) {
    try {
      if (this.useSupabase) {
        // Get campaign details
        const { data: campaign, error: campaignError } = await supabase
          .from('email_campaigns')
          .select(`
            *,
            segment:customer_segments (
              id,
              name
            )
          `)
          .eq('id', campaignId)
          .single();

        if (campaignError) throw campaignError;

        // Get segment customers if segment is specified
        let recipients = [];
        if (campaign.segment) {
          const CRMService = require('./crmService');
          const crmService = new CRMService();
          const segmentData = await crmService.getSegmentCustomers(campaign.segment.id, { limit: 10000 });
          recipients = segmentData.customers;
        }

        // Update campaign status
        await supabase
          .from('email_campaigns')
          .update({
            status: 'sending',
            sent_at: new Date().toISOString(),
            total_recipients: recipients.length
          })
          .eq('id', campaignId);

        // Send emails (in production, this would be a background job)
        const results = await this.sendMarketingEmail({
          recipients,
          templateIdOrName: campaign.template_id || campaign.name,
          variables: {},
          campaignId
        });

        // Update campaign with results
        const successCount = results.filter(r => r.success).length;
        await supabase
          .from('email_campaigns')
          .update({
            status: 'sent',
            sent_count: successCount,
            delivered_count: successCount // Simplified - would track actual delivery
          })
          .eq('id', campaignId);

        return {
          success: true,
          totalRecipients: recipients.length,
          sentCount: successCount,
          results
        };
      } else {
        // Fallback to PostgreSQL
        const CRMService = require('./crmService');
        const crmService = new CRMService();
        
        // Similar implementation using PostgreSQL
        throw new Error('PostgreSQL fallback not implemented for campaigns');
      }
    } catch (error) {
      console.error('Error launching email campaign:', error);
      throw error;
    }
  }

  /**
   * Email Analytics Methods
   */

  // Get email analytics
  async getEmailAnalytics(dateRange = '30') {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('email_logs')
          .select('status, template_type, created_at')
          .gte('created_at', startDate.toISOString());

        if (error) throw error;

        const analytics = {
          total: data.length,
          sent: data.filter(e => e.status === 'sent').length,
          delivered: data.filter(e => e.status === 'delivered').length,
          opened: data.filter(e => e.status === 'opened').length,
          clicked: data.filter(e => e.status === 'clicked').length,
          failed: data.filter(e => e.status === 'failed').length,
          byType: data.reduce((acc, email) => {
            acc[email.template_type] = (acc[email.template_type] || 0) + 1;
            return acc;
          }, {})
        };

        return analytics;
      } else {
        // Fallback to PostgreSQL
        const query = `
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'sent') as sent,
            COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
            COUNT(*) FILTER (WHERE status = 'opened') as opened,
            COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
            COUNT(*) FILTER (WHERE status = 'failed') as failed
          FROM email_logs 
          WHERE created_at >= $1
        `;

        const result = await pool.query(query, [startDate]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error getting email analytics:', error);
      throw error;
    }
  }

  /**
   * Helper Methods
   */

  // Process template variables
  processTemplate(template, variables) {
    let processed = template;
    
    // Replace {{variable}} syntax
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });

    return processed;
  }

  // Update email log
  async updateEmailLog(logId, updates) {
    try {
      if (this.useSupabase) {
        const { error } = await supabase
          .from('email_logs')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', logId);

        if (error) throw error;
      } else {
        // Fallback to PostgreSQL
        const setClause = Object.keys(updates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');

        const query = `
          UPDATE email_logs 
          SET ${setClause}, updated_at = NOW()
          WHERE id = $1
        `;

        const values = [logId, ...Object.values(updates)];
        await pool.query(query, values);
      }
    } catch (error) {
      console.error('Error updating email log:', error);
    }
  }

  // Schedule email for later
  async scheduleEmail(options) {
    // In production, this would use a job queue like Bull or Agenda
    console.log('Email scheduling not implemented - would use job queue');
    return { success: true, scheduled: true };
  }
}

module.exports = new EmailService();
