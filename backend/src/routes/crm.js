/**
 * CRM API Routes
 * Complete CRM functionality endpoints for admin dashboard
 */

const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { 
  validateCRMAdmin, 
  validateCustomerAccess, 
  validateCRMOperation, 
  crmRateLimit,
  validateCRMData,
  sanitizeCRMData
} = require('../middleware/crmMiddleware');
const crmService = require('../services/crmService');
const emailService = require('../services/emailService');
const automationService = require('../services/automationService');
const router = express.Router();

// Apply authentication and CRM admin validation to all CRM routes
router.use(authenticateToken);
router.use(validateCRMAdmin);
router.use(sanitizeCRMData);

// Apply rate limiting to all CRM routes
router.use(crmRateLimit(200, 15 * 60 * 1000)); // 200 requests per 15 minutes

/**
 * Customer Management Routes
 */

// Get all customers with pagination and filtering
router.get('/customers', async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      search: req.query.search || '',
      lifecycleStage: req.query.lifecycleStage || '',
      segmentId: req.query.segmentId || '',
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc',
      includeAnalytics: req.query.includeAnalytics === 'true'
    };

    const result = await crmService.getCustomers(options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

// Get single customer profile
router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const includeAnalytics = req.query.includeAnalytics === 'true';
    
    const customer = await crmService.getCustomerProfile(id, includeAnalytics);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});

// Update customer profile
router.put('/customers/:id', 
  validateCRMOperation('write'),
  validateCRMData('customer_profile'),
  auditLog('update_customer', 'customer_profile'), 
  async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Store old data for audit
    const oldCustomer = await crmService.getCustomerProfile(id);
    req.oldData = oldCustomer;

    const customer = await crmService.updateCustomerProfile(id, updates);
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

// Soft delete customer
router.delete('/customers/:id', 
  validateCRMOperation('delete'),
  auditLog('delete_customer', 'customer_profile'), 
  async (req, res) => {
  try {
    const { id } = req.params;
    
    // Store old data for audit
    const oldCustomer = await crmService.getCustomerProfile(id);
    req.oldData = oldCustomer;

    const customer = await crmService.softDeleteCustomer(id);
    
    res.json({
      success: true,
      message: 'Customer deleted successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
});

/**
 * Customer Notes Routes
 */

// Get customer notes
router.get('/customers/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      note_type: req.query.note_type || ''
    };

    const result = await crmService.getCustomerNotes(id, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching customer notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer notes',
      error: error.message
    });
  }
});

// Add customer note
router.post('/customers/:id/notes', auditLog('add_note', 'customer_note'), async (req, res) => {
  try {
    const { id } = req.params;
    const noteData = {
      admin_id: req.user.id,
      ...req.body
    };

    const note = await crmService.addCustomerNote(id, noteData);
    
    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: note
    });
  } catch (error) {
    console.error('Error adding customer note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add customer note',
      error: error.message
    });
  }
});

/**
 * Customer Tags Routes
 */

// Get all customer tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await crmService.getCustomerTags();
    
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error fetching customer tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer tags',
      error: error.message
    });
  }
});

// Add tag to customer
router.post('/customers/:id/tags', auditLog('add_tag', 'customer_tag_map'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tagId } = req.body;
    
    const result = await crmService.addCustomerTag(id, tagId, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Tag added successfully',
      data: result
    });
  } catch (error) {
    console.error('Error adding customer tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add customer tag',
      error: error.message
    });
  }
});

// Remove tag from customer
router.delete('/customers/:id/tags/:tagId', auditLog('remove_tag', 'customer_tag_map'), async (req, res) => {
  try {
    const { id, tagId } = req.params;
    
    const result = await crmService.removeCustomerTag(id, tagId);
    
    res.json({
      success: true,
      message: 'Tag removed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error removing customer tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove customer tag',
      error: error.message
    });
  }
});

/**
 * Customer Segmentation Routes
 */

// Get all customer segments
router.get('/segments', async (req, res) => {
  try {
    const segments = await crmService.getCustomerSegments();
    
    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    console.error('Error fetching customer segments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer segments',
      error: error.message
    });
  }
});

// Create customer segment
router.post('/segments', auditLog('create_segment', 'customer_segments'), async (req, res) => {
  try {
    const segmentData = {
      ...req.body,
      created_by: req.user.id
    };

    const segment = await crmService.createCustomerSegment(segmentData);
    
    res.status(201).json({
      success: true,
      message: 'Segment created successfully',
      data: segment
    });
  } catch (error) {
    console.error('Error creating customer segment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer segment',
      error: error.message
    });
  }
});

// Get customers in segment
router.get('/segments/:id/customers', async (req, res) => {
  try {
    const { id } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await crmService.getSegmentCustomers(id, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching segment customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch segment customers',
      error: error.message
    });
  }
});

// Update dynamic segments
router.post('/segments/update-dynamic', auditLog('update_segments', 'customer_segments'), async (req, res) => {
  try {
    const result = await crmService.updateDynamicSegments();
    
    res.json({
      success: true,
      message: 'Dynamic segments updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating dynamic segments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dynamic segments',
      error: error.message
    });
  }
});

/**
 * Email Templates Routes
 */

// Get all email templates
router.get('/email/templates', async (req, res) => {
  try {
    const { type, category } = req.query;
    
    let query;
    if (crmService.useSupabase) {
      query = crmService.supabase.from('email_templates').select('*');
      
      if (type) query = query.eq('template_type', type);
      if (category) query = query.eq('category', category);
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      
      res.json({
        success: true,
        data: data || []
      });
    } else {
      // Fallback to PostgreSQL
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      if (type) {
        whereConditions.push(`template_type = $${paramIndex++}`);
        params.push(type);
      }

      if (category) {
        whereConditions.push(`category = $${paramIndex++}`);
        params.push(category);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const query = `SELECT * FROM email_templates ${whereClause} ORDER BY name`;
      const result = await crmService.pool.query(query, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    }
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates',
      error: error.message
    });
  }
});

// Create email template
router.post('/email/templates', auditLog('create_template', 'email_templates'), async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      created_by: req.user.id
    };

    const template = await emailService.createTemplate(templateData);
    
    res.status(201).json({
      success: true,
      message: 'Email template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create email template',
      error: error.message
    });
  }
});

// Update email template
router.put('/email/templates/:id', auditLog('update_template', 'email_templates'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const template = await emailService.updateTemplate(id, updates);
    
    res.json({
      success: true,
      message: 'Email template updated successfully',
      data: template
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template',
      error: error.message
    });
  }
});

// Send test email
router.post('/email/send-test', auditLog('send_test_email', 'email_logs'), async (req, res) => {
  try {
    const { to, templateIdOrName, variables } = req.body;
    
    const result = await emailService.sendEmail({
      to,
      templateIdOrName,
      variables
    });
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Get email analytics
router.get('/email/analytics', async (req, res) => {
  try {
    const dateRange = req.query.dateRange || '30';
    
    const analytics = await emailService.getEmailAnalytics(dateRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching email analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email analytics',
      error: error.message
    });
  }
});

/**
 * Email Campaigns Routes
 */

// Get all email campaigns
router.get('/email/campaigns', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query;
    if (crmService.useSupabase) {
      query = crmService.supabase
        .from('email_campaigns')
        .select(`
          *,
          creator:created_by (
            first_name,
            last_name,
            email
          ),
          segment:customer_segments (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (status) query = query.eq('status', status);
      
      const { data, error } = await query;
      if (error) throw error;
      
      res.json({
        success: true,
        data: data || []
      });
    } else {
      // Fallback to PostgreSQL
      const query = `
        SELECT ec.*, u.first_name, u.last_name, u.email, cs.name as segment_name
        FROM email_campaigns ec
        JOIN users u ON ec.created_by = u.id
        LEFT JOIN customer_segments cs ON ec.segment_id = cs.id
        ${status ? 'WHERE ec.status = $1' : ''}
        ORDER BY ec.created_at DESC
      `;
      
      const result = await crmService.pool.query(
        status ? query : query.replace('WHERE ec.status = $1', ''),
        status ? [status] : []
      );
      
      res.json({
        success: true,
        data: result.rows
      });
    }
  } catch (error) {
    console.error('Error fetching email campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email campaigns',
      error: error.message
    });
  }
});

// Create email campaign
router.post('/email/campaigns', auditLog('create_campaign', 'email_campaigns'), async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      created_by: req.user.id
    };

    const campaign = await emailService.createCampaign(campaignData);
    
    res.status(201).json({
      success: true,
      message: 'Email campaign created successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Error creating email campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create email campaign',
      error: error.message
    });
  }
});

// Launch email campaign
router.post('/email/campaigns/:id/launch', auditLog('launch_campaign', 'email_campaigns'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await emailService.launchCampaign(id);
    
    res.json({
      success: true,
      message: 'Email campaign launched successfully',
      data: result
    });
  } catch (error) {
    console.error('Error launching email campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to launch email campaign',
      error: error.message
    });
  }
});

/**
 * CRM Automation Routes
 */

// Get all automations
router.get('/automations', async (req, res) => {
  try {
    const options = {
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
      triggerType: req.query.triggerType || ''
    };

    const automations = await automationService.getAutomations(options);
    
    res.json({
      success: true,
      data: automations
    });
  } catch (error) {
    console.error('Error fetching automations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automations',
      error: error.message
    });
  }
});

// Create automation
router.post('/automations', auditLog('create_automation', 'crm_automations'), async (req, res) => {
  try {
    const automationData = {
      ...req.body,
      created_by: req.user.id
    };

    const automation = await automationService.createAutomation(automationData);
    
    res.status(201).json({
      success: true,
      message: 'Automation created successfully',
      data: automation
    });
  } catch (error) {
    console.error('Error creating automation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create automation',
      error: error.message
    });
  }
});

// Update automation
router.put('/automations/:id', auditLog('update_automation', 'crm_automations'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const automation = await automationService.updateAutomation(id, updates);
    
    res.json({
      success: true,
      message: 'Automation updated successfully',
      data: automation
    });
  } catch (error) {
    console.error('Error updating automation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update automation',
      error: error.message
    });
  }
});

// Get automation logs
router.get('/automations/logs', async (req, res) => {
  try {
    const options = {
      automationId: req.query.automationId || null,
      customerId: req.query.customerId || null,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await automationService.getAutomationLogs(options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching automation logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation logs',
      error: error.message
    });
  }
});

// Manually trigger automation
router.post('/automations/:id/trigger', auditLog('trigger_automation', 'crm_automations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { triggerData, customerId } = req.body;
    
    // Get automation details
    const automations = await automationService.getAutomations();
    const automation = automations.find(a => a.id === id);
    
    if (!automation) {
      return res.status(404).json({
        success: false,
        message: 'Automation not found'
      });
    }

    const results = await automationService.executeAutomation(automation, triggerData, customerId);
    
    res.json({
      success: true,
      message: 'Automation triggered successfully',
      data: results
    });
  } catch (error) {
    console.error('Error triggering automation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger automation',
      error: error.message
    });
  }
});

/**
 * CRM Analytics Routes
 */

// Get CRM dashboard analytics
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const dateRange = req.query.dateRange || '30';
    
    const analytics = await crmService.getCustomerAnalytics(dateRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching CRM analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CRM analytics',
      error: error.message
    });
  }
});

// Get customer lifecycle analytics
router.get('/analytics/lifecycle', async (req, res) => {
  try {
    const dateRange = req.query.dateRange || '30';
    
    // This would be implemented in the CRM service
    const analytics = await crmService.getCustomerAnalytics(dateRange);
    
    res.json({
      success: true,
      data: {
        lifecycleStages: analytics.lifecycleStages || {},
        totalCustomers: analytics.totalCustomers || 0,
        newCustomers: analytics.newCustomers || 0
      }
    });
  } catch (error) {
    console.error('Error fetching lifecycle analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lifecycle analytics',
      error: error.message
    });
  }
});

/**
 * CRM Settings Routes
 */

// Get CRM settings
router.get('/settings', async (req, res) => {
  try {
    // Return CRM-specific settings
    const settings = {
      email: {
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        from_name: process.env.EMAIL_FROM_NAME || 'Afro Superstore',
        from_address: process.env.EMAIL_FROM_ADDRESS || 'noreply@afrosuperstore.ca'
      },
      automation: {
        enabled: true,
        max_executions_per_hour: 1000
      },
      segmentation: {
        auto_update_interval: '1 hour',
        max_segments_per_customer: 50
      }
    };
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching CRM settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CRM settings',
      error: error.message
    });
  }
});

module.exports = router;
