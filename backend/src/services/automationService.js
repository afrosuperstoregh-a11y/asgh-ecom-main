/**
 * CRM Automation Service
 * Workflow engine for customer relationship management automation
 */

const { supabase } = require('../config/supabase');
const { Pool } = require('pg');
const emailService = require('./emailService');
const crmService = require('./crmService');

// Fallback PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class AutomationService {
  constructor() {
    this.useSupabase = !!supabase;
    this.runningAutomations = new Map(); // Track running automations
  }

  /**
   * Automation Management Methods
   */

  // Get all automations
  async getAutomations(options = {}) {
    const { isActive = null, triggerType = '' } = options;

    try {
      if (this.useSupabase) {
        let query = supabase
          .from('crm_automations')
          .select(`
            *,
            creator:created_by (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (isActive !== null) {
          query = query.eq('is_active', isActive);
        }

        if (triggerType) {
          query = query.eq('trigger_type', triggerType);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } else {
        // Fallback to PostgreSQL
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (isActive !== null) {
          whereConditions.push(`is_active = $${paramIndex++}`);
          params.push(isActive);
        }

        if (triggerType) {
          whereConditions.push(`trigger_type = $${paramIndex++}`);
          params.push(triggerType);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const query = `
          SELECT ca.*, u.first_name, u.last_name, u.email
          FROM crm_automations ca
          JOIN users u ON ca.created_by = u.id
          ${whereClause}
          ORDER BY ca.created_at DESC
        `;

        const result = await pool.query(query, params);
        return result.rows;
      }
    } catch (error) {
      console.error('Error getting automations:', error);
      throw error;
    }
  }

  // Create automation
  async createAutomation(automationData) {
    try {
      const {
        name,
        description,
        trigger_type,
        trigger_config,
        actions,
        is_active = true,
        created_by
      } = automationData;

      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('crm_automations')
          .insert({
            name,
            description,
            trigger_type,
            trigger_config,
            actions,
            is_active,
            created_by
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO crm_automations (
            name, description, trigger_type, trigger_config, 
            actions, is_active, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const result = await pool.query(query, [
          name, description, trigger_type, 
          JSON.stringify(trigger_config), 
          JSON.stringify(actions), 
          is_active, created_by
        ]);

        return result.rows[0];
      }
    } catch (error) {
      console.error('Error creating automation:', error);
      throw error;
    }
  }

  // Update automation
  async updateAutomation(automationId, updates) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('crm_automations')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', automationId)
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
          UPDATE crm_automations 
          SET ${setClause}, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;

        const values = [automationId, ...Object.values(updates)];
        const result = await pool.query(query, values);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error updating automation:', error);
      throw error;
    }
  }

  /**
   * Trigger Methods
   */

  // Trigger automation by type
  async triggerAutomation(triggerType, triggerData, customerId = null) {
    try {
      // Get active automations for this trigger type
      const automations = await this.getAutomations({ 
        isActive: true, 
        triggerType 
      });

      const results = [];

      for (const automation of automations) {
        try {
          // Check if trigger conditions are met
          if (await this.evaluateTriggerConditions(automation, triggerData)) {
            const result = await this.executeAutomation(automation, triggerData, customerId);
            results.push({
              automationId: automation.id,
              automationName: automation.name,
              success: true,
              result
            });
          }
        } catch (error) {
          console.error(`Error executing automation ${automation.id}:`, error);
          results.push({
            automationId: automation.id,
            automationName: automation.name,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error triggering automations:', error);
      throw error;
    }
  }

  // Evaluate trigger conditions
  async evaluateTriggerConditions(automation, triggerData) {
    try {
      const { trigger_config } = automation;

      switch (automation.trigger_type) {
        case 'order_placed':
          return await this.evaluateOrderTrigger(trigger_config, triggerData);
        case 'order_shipped':
          return await this.evaluateShippingTrigger(trigger_config, triggerData);
        case 'customer_inactive':
          return await this.evaluateInactiveTrigger(trigger_config, triggerData);
        case 'customer_signup':
          return await this.evaluateSignupTrigger(trigger_config, triggerData);
        case 'segment_changed':
          return await this.evaluateSegmentTrigger(trigger_config, triggerData);
        default:
          return true; // No conditions for custom triggers
      }
    } catch (error) {
      console.error('Error evaluating trigger conditions:', error);
      return false;
    }
  }

  // Execute automation actions
  async executeAutomation(automation, triggerData, customerId = null) {
    const startTime = Date.now();
    let logData = {
      automation_id: automation.id,
      customer_id: customerId,
      trigger_data: triggerData,
      actions_executed: [],
      status: 'success',
      error_message: null
    };

    try {
      const { actions } = automation;
      const executedActions = [];

      for (const action of actions) {
        try {
          const actionResult = await this.executeAction(action, triggerData, customerId);
          executedActions.push({
            action: action.type,
            success: true,
            result: actionResult
          });
        } catch (actionError) {
          executedActions.push({
            action: action.type,
            success: false,
            error: actionError.message
          });
          throw actionError;
        }
      }

      logData.actions_executed = executedActions;
      logData.execution_time_ms = Date.now() - startTime;

      // Update automation run count
      await this.updateAutomationRunCount(automation.id);

      return executedActions;
    } catch (error) {
      logData.status = 'failed';
      logData.error_message = error.message;
      logData.execution_time_ms = Date.now() - startTime;
      throw error;
    } finally {
      // Log automation execution
      await this.logAutomationExecution(logData);
    }
  }

  // Execute individual action
  async executeAction(action, triggerData, customerId) {
    try {
      switch (action.type) {
        case 'send_email':
          return await this.executeEmailAction(action, triggerData, customerId);
        case 'add_tag':
          return await this.executeAddTagAction(action, triggerData, customerId);
        case 'remove_tag':
          return await this.executeRemoveTagAction(action, triggerData, customerId);
        case 'update_lifecycle_stage':
          return await this.executeLifecycleAction(action, triggerData, customerId);
        case 'add_to_segment':
          return await this.executeAddSegmentAction(action, triggerData, customerId);
        case 'remove_from_segment':
          return await this.executeRemoveSegmentAction(action, triggerData, customerId);
        case 'create_note':
          return await this.executeNoteAction(action, triggerData, customerId);
        case 'webhook':
          return await this.executeWebhookAction(action, triggerData, customerId);
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      throw error;
    }
  }

  /**
   * Action Execution Methods
   */

  // Execute email action
  async executeEmailAction(action, triggerData, customerId) {
    try {
      const { template_name, variables = {}, recipient } = action.config;

      // Get customer data if needed
      let customerData = {};
      if (customerId) {
        customerData = await crmService.getCustomerProfile(customerId);
      }

      // Merge trigger data with customer data
      const emailVariables = {
        ...triggerData,
        ...customerData,
        ...variables
      };

      // Determine recipient
      let recipientEmail;
      if (recipient === 'customer' && customerData.users) {
        recipientEmail = customerData.users.email;
      } else if (typeof recipient === 'string') {
        recipientEmail = recipient;
      } else {
        throw new Error('Invalid recipient configuration');
      }

      // Send email
      const result = await emailService.sendEmail({
        to: recipientEmail,
        templateIdOrName: template_name,
        variables: emailVariables,
        customerId
      });

      return result;
    } catch (error) {
      console.error('Error executing email action:', error);
      throw error;
    }
  }

  // Execute add tag action
  async executeAddTagAction(action, triggerData, customerId) {
    try {
      const { tag_name, admin_id } = action.config;

      if (!customerId) {
        throw new Error('Customer ID required for tag actions');
      }

      // Get or create tag
      const tags = await crmService.getCustomerTags();
      let tag = tags.find(t => t.name === tag_name);
      
      if (!tag) {
        // Create new tag
        if (this.useSupabase) {
          const { data, error } = await supabase
            .from('customer_tags')
            .insert({
              name: tag_name,
              color: '#6B7280',
              created_by: admin_id
            })
            .select()
            .single();

          if (error) throw error;
          tag = data;
        } else {
          // Fallback to PostgreSQL
          const query = `
            INSERT INTO customer_tags (name, color, created_by)
            VALUES ($1, $2, $3)
            RETURNING *
          `;
          const result = await pool.query(query, [tag_name, '#6B7280', admin_id]);
          tag = result.rows[0];
        }
      }

      // Add tag to customer
      return await crmService.addCustomerTag(customerId, tag.id, admin_id);
    } catch (error) {
      console.error('Error executing add tag action:', error);
      throw error;
    }
  }

  // Execute remove tag action
  async executeRemoveTagAction(action, triggerData, customerId) {
    try {
      const { tag_name } = action.config;

      if (!customerId) {
        throw new Error('Customer ID required for tag actions');
      }

      // Get tag
      const tags = await crmService.getCustomerTags();
      const tag = tags.find(t => t.name === tag_name);
      
      if (!tag) {
        throw new Error(`Tag not found: ${tag_name}`);
      }

      // Remove tag from customer
      return await crmService.removeCustomerTag(customerId, tag.id);
    } catch (error) {
      console.error('Error executing remove tag action:', error);
      throw error;
    }
  }

  // Execute lifecycle stage action
  async executeLifecycleAction(action, triggerData, customerId) {
    try {
      const { stage } = action.config;

      if (!customerId) {
        throw new Error('Customer ID required for lifecycle actions');
      }

      return await crmService.updateCustomerProfile(customerId, {
        lifecycle_stage: stage
      });
    } catch (error) {
      console.error('Error executing lifecycle action:', error);
      throw error;
    }
  }

  // Execute add to segment action
  async executeAddSegmentAction(action, triggerData, customerId) {
    try {
      const { segment_name } = action.config;

      if (!customerId) {
        throw new Error('Customer ID required for segment actions');
      }

      // Get segment
      const segments = await crmService.getCustomerSegments();
      const segment = segments.find(s => s.name === segment_name);
      
      if (!segment) {
        throw new Error(`Segment not found: ${segment_name}`);
      }

      // Add customer to segment
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_segment_memberships')
          .insert({
            customer_id: customerId,
            segment_id: segment.id,
            added_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO customer_segment_memberships (customer_id, segment_id, added_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (customer_id, segment_id) DO NOTHING
          RETURNING *
        `;
        const result = await pool.query(query, [customerId, segment.id]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error executing add segment action:', error);
      throw error;
    }
  }

  // Execute remove from segment action
  async executeRemoveSegmentAction(action, triggerData, customerId) {
    try {
      const { segment_name } = action.config;

      if (!customerId) {
        throw new Error('Customer ID required for segment actions');
      }

      // Get segment
      const segments = await crmService.getCustomerSegments();
      const segment = segments.find(s => s.name === segment_name);
      
      if (!segment) {
        throw new Error(`Segment not found: ${segment_name}`);
      }

      // Remove customer from segment
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_segment_memberships')
          .delete()
          .eq('customer_id', customerId)
          .eq('segment_id', segment.id)
          .select();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          DELETE FROM customer_segment_memberships 
          WHERE customer_id = $1 AND segment_id = $2
          RETURNING *
        `;
        const result = await pool.query(query, [customerId, segment.id]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error executing remove segment action:', error);
      throw error;
    }
  }

  // Execute note action
  async executeNoteAction(action, triggerData, customerId) {
    try {
      const { note, note_type = 'general', admin_id } = action.config;

      if (!customerId) {
        throw new Error('Customer ID required for note actions');
      }

      return await crmService.addCustomerNote(customerId, {
        admin_id,
        note,
        note_type,
        is_private: true
      });
    } catch (error) {
      console.error('Error executing note action:', error);
      throw error;
    }
  }

  // Execute webhook action
  async executeWebhookAction(action, triggerData, customerId) {
    try {
      const { url, method = 'POST', headers = {}, body_template } = action.config;

      // Process webhook body template
      let body = JSON.stringify(triggerData);
      if (body_template) {
        body = JSON.stringify({
          ...triggerData,
          customer_id: customerId,
          timestamp: new Date().toISOString()
        });
      }

      // Make webhook request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      return {
        status: response.status,
        statusText: response.statusText,
        data: await response.text()
      };
    } catch (error) {
      console.error('Error executing webhook action:', error);
      throw error;
    }
  }

  /**
   * Trigger Evaluation Methods
   */

  // Evaluate order trigger
  async evaluateOrderTrigger(triggerConfig, triggerData) {
    try {
      const { min_amount = 0, max_amount = null, specific_products = [] } = triggerConfig;
      
      if (triggerData.total_amount < min_amount) {
        return false;
      }

      if (max_amount && triggerData.total_amount > max_amount) {
        return false;
      }

      if (specific_products.length > 0) {
        const orderProducts = triggerData.products || [];
        const hasSpecificProduct = orderProducts.some(product => 
          specific_products.includes(product.id) || specific_products.includes(product.sku)
        );
        
        if (!hasSpecificProduct) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating order trigger:', error);
      return false;
    }
  }

  // Evaluate shipping trigger
  async evaluateShippingTrigger(triggerConfig, triggerData) {
    try {
      const { shipping_method, specific_carriers = [] } = triggerConfig;
      
      if (shipping_method && triggerData.shipping_method !== shipping_method) {
        return false;
      }

      if (specific_carriers.length > 0) {
        if (!specific_carriers.includes(triggerData.carrier)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating shipping trigger:', error);
      return false;
    }
  }

  // Evaluate inactive trigger
  async evaluateInactiveTrigger(triggerConfig, triggerData) {
    try {
      const { days_inactive = 30 } = triggerConfig;
      
      if (!triggerData.last_order_date && !triggerData.last_activity) {
        return false;
      }

      const lastActivity = new Date(
        triggerData.last_order_date || triggerData.last_activity
      );
      const daysSinceActivity = Math.floor(
        (new Date() - lastActivity) / (1000 * 60 * 60 * 24)
      );

      return daysSinceActivity >= days_inactive;
    } catch (error) {
      console.error('Error evaluating inactive trigger:', error);
      return false;
    }
  }

  // Evaluate signup trigger
  async evaluateSignupTrigger(triggerConfig, triggerData) {
    try {
      const { min_hours = 0, max_hours = null } = triggerConfig;
      
      if (!triggerData.created_at) {
        return false;
      }

      const signupTime = new Date(triggerData.created_at);
      const hoursSinceSignup = Math.floor(
        (new Date() - signupTime) / (1000 * 60 * 60)
      );

      if (hoursSinceSignup < min_hours) {
        return false;
      }

      if (max_hours && hoursSinceSignup > max_hours) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error evaluating signup trigger:', error);
      return false;
    }
  }

  // Evaluate segment trigger
  async evaluateSegmentTrigger(triggerConfig, triggerData) {
    try {
      const { segment_name, action = 'added' } = triggerConfig;
      
      if (!triggerData.segment_changes) {
        return false;
      }

      const segmentChange = triggerData.segment_changes.find(
        change => change.segment_name === segment_name
      );

      if (!segmentChange) {
        return false;
      }

      return segmentChange.action === action;
    } catch (error) {
      console.error('Error evaluating segment trigger:', error);
      return false;
    }
  }

  /**
   * Helper Methods
   */

  // Update automation run count
  async updateAutomationRunCount(automationId) {
    try {
      if (this.useSupabase) {
        await supabase.rpc('increment_automation_runs', { automation_id: automationId });
      } else {
        // Fallback to PostgreSQL
        const query = `
          UPDATE crm_automations 
          SET run_count = run_count + 1, last_run_at = NOW()
          WHERE id = $1
        `;
        await pool.query(query, [automationId]);
      }
    } catch (error) {
      console.error('Error updating automation run count:', error);
    }
  }

  // Log automation execution
  async logAutomationExecution(logData) {
    try {
      if (this.useSupabase) {
        await supabase
          .from('crm_automation_logs')
          .insert({
            automation_id: logData.automation_id,
            customer_id: logData.customer_id,
            trigger_data: logData.trigger_data,
            actions_executed: logData.actions_executed,
            status: logData.status,
            error_message: logData.error_message,
            execution_time_ms: logData.execution_time_ms
          });
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO crm_automation_logs (
            automation_id, customer_id, trigger_data, actions_executed,
            status, error_message, execution_time_ms
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await pool.query(query, [
          logData.automation_id,
          logData.customer_id,
          JSON.stringify(logData.trigger_data),
          JSON.stringify(logData.actions_executed),
          logData.status,
          logData.error_message,
          logData.execution_time_ms
        ]);
      }
    } catch (error) {
      console.error('Error logging automation execution:', error);
    }
  }

  // Get automation logs
  async getAutomationLogs(options = {}) {
    const { automationId = null, customerId = null, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    try {
      if (this.useSupabase) {
        let query = supabase
          .from('crm_automation_logs')
          .select(`
            *,
            automation:crm_automations (
              name,
              trigger_type
            )
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (automationId) {
          query = query.eq('automation_id', automationId);
        }

        if (customerId) {
          query = query.eq('customer_id', customerId);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
          logs: data || [],
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        };
      } else {
        // Fallback to PostgreSQL
        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (automationId) {
          whereConditions.push(`automation_id = $${paramIndex++}`);
          params.push(automationId);
        }

        if (customerId) {
          whereConditions.push(`customer_id = $${paramIndex++}`);
          params.push(customerId);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const query = `
          SELECT cal.*, ca.name as automation_name, ca.trigger_type
          FROM crm_automation_logs cal
          JOIN crm_automations ca ON cal.automation_id = ca.id
          ${whereClause}
          ORDER BY cal.created_at DESC
          LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(limit, offset);
        const result = await pool.query(query, params);

        // Get total count
        const countQuery = `
          SELECT COUNT(*) 
          FROM crm_automation_logs 
          ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult.rows[0].count);

        return {
          logs: result.rows,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };
      }
    } catch (error) {
      console.error('Error getting automation logs:', error);
      throw error;
    }
  }
}

module.exports = new AutomationService();
