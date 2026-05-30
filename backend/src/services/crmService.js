/**
 * CRM Service Layer
 * Centralized service for all CRM operations with Supabase integration
 */

const { supabase } = require('../config/supabase');
const { Pool } = require('pg');

// Fallback PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class CRMService {
  constructor() {
    this.useSupabase = !!supabase;
  }

  /**
   * Customer Management Methods
   */

  // Get customer profile with analytics
  async getCustomerProfile(customerId, includeAnalytics = false) {
    try {
      if (this.useSupabase) {
        let query = supabase
          .from('customer_profiles')
          .select(`
            *,
            users:user_id (
              id,
              email,
              first_name,
              last_name,
              phone,
              role,
              created_at
            )
          `)
          .eq('id', customerId)
          .eq('soft_deleted', false)
          .single();

        const { data, error } = await query;
        if (error) throw error;

        if (includeAnalytics) {
          // Get additional analytics
          const { data: analytics } = await supabase
            .from('customer_analytics')
            .select('*')
            .eq('customer_profile_id', customerId)
            .single();

          return { ...data, analytics };
        }

        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          SELECT 
            cp.*,
            u.id as user_id,
            u.email,
            u.first_name,
            u.last_name,
            u.phone,
            u.role,
            u.created_at as user_created_at
          FROM customer_profiles cp
          JOIN users u ON cp.user_id = u.id
          WHERE cp.id = $1 AND cp.soft_deleted = false
        `;
        
        const result = await pool.query(query, [customerId]);
        return result.rows[0] || null;
      }
    } catch (error) {
      console.error('Error getting customer profile:', error);
      throw error;
    }
  }

  // Get all customers with pagination and filtering
  async getCustomers(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      lifecycleStage = '',
      segmentId = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      includeAnalytics = false
    } = options;

    try {
      const offset = (page - 1) * limit;

      // Validate sortBy to prevent SQL injection - whitelist allowed columns
      const allowedSortColumns = [
        'created_at', 'updated_at', 'lifecycle_stage', 'total_spend', 
        'order_count', 'last_order_date', 'first_name', 'last_name', 'email'
      ];
      const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
      
      // Validate sortOrder to prevent SQL injection
      const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      if (this.useSupabase) {
        let query = supabase
          .from('customer_profiles')
          .select(`
            *,
            users:user_id (
              email,
              first_name,
              last_name,
              phone
            ),
            customer_tag_map (
              tag:customer_tags (
                id,
                name,
                color
              )
            ),
            customer_segment_memberships (
              segment:customer_segments (
                id,
                name
              )
            )
          `, { count: 'exact' })
          .eq('soft_deleted', false);

        // Apply filters
        if (search) {
          query = query.or(`users.first_name.ilike.%${search}%,users.last_name.ilike.%${search}%,users.email.ilike.%${search}%`);
        }

        if (lifecycleStage) {
          query = query.eq('lifecycle_stage', lifecycleStage);
        }

        if (segmentId) {
          query = query.eq('customer_segment_memberships.segment_id', segmentId);
        }

        // Apply sorting
        query = query.order(safeSortBy, { ascending: safeSortOrder === 'ASC' });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
          customers: data || [],
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        };
      } else {
        // Fallback to PostgreSQL
        let whereConditions = ['cp.soft_deleted = false'];
        let params = [];
        let paramIndex = 1;

        if (search) {
          whereConditions.push(`(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
          params.push(`%${search}%`);
          paramIndex++;
        }

        if (lifecycleStage) {
          whereConditions.push(`cp.lifecycle_stage = $${paramIndex}`);
          params.push(lifecycleStage);
          paramIndex++;
        }

        if (segmentId) {
          whereConditions.push(`EXISTS (SELECT 1 FROM customer_segment_memberships csm WHERE csm.customer_id = cp.id AND csm.segment_id = $${paramIndex})`);
          params.push(segmentId);
          paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM customer_profiles cp JOIN users u ON cp.user_id = u.id WHERE ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Get customers - use validated column names to prevent SQL injection
        const dataQuery = `
          SELECT 
            cp.*,
            u.email,
            u.first_name,
            u.last_name,
            u.phone,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', ct.id,
                  'name', ct.name,
                  'color', ct.color
                )
              ) FILTER (WHERE ct.id IS NOT NULL),
              '[]'::json
            ) as tags
          FROM customer_profiles cp
          JOIN users u ON cp.user_id = u.id
          LEFT JOIN customer_tag_map ctm ON cp.id = ctm.customer_id
          LEFT JOIN customer_tags ct ON ctm.tag_id = ct.id
          WHERE ${whereClause}
          GROUP BY cp.id, u.email, u.first_name, u.last_name, u.phone
          ORDER BY cp.${safeSortBy} ${safeSortOrder}
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);
        const dataResult = await pool.query(dataQuery, params);

        return {
          customers: dataResult.rows,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };
      }
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }

  // Create or update customer profile
  async upsertCustomerProfile(customerData) {
    try {
      const {
        user_id,
        lifecycle_stage = 'lead',
        preferred_language = 'en',
        timezone = 'UTC',
        marketing_consent = true,
        sms_consent = false
      } = customerData;

      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_profiles')
          .upsert({
            user_id,
            lifecycle_stage,
            preferred_language,
            timezone,
            marketing_consent,
            sms_consent,
            last_activity: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO customer_profiles (
            user_id, lifecycle_stage, preferred_language, timezone, 
            marketing_consent, sms_consent, last_activity
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET
            lifecycle_stage = EXCLUDED.lifecycle_stage,
            preferred_language = EXCLUDED.preferred_language,
            timezone = EXCLUDED.timezone,
            marketing_consent = EXCLUDED.marketing_consent,
            sms_consent = EXCLUDED.sms_consent,
            last_activity = EXCLUDED.last_activity,
            updated_at = NOW()
          RETURNING *
        `;

        const result = await pool.query(query, [
          user_id, lifecycle_stage, preferred_language, timezone,
          marketing_consent, sms_consent
        ]);

        return result.rows[0];
      }
    } catch (error) {
      console.error('Error upserting customer profile:', error);
      throw error;
    }
  }

  // Update customer profile
  async updateCustomerProfile(customerId, updates) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId)
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
          UPDATE customer_profiles 
          SET ${setClause}, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;

        const values = [customerId, ...Object.values(updates)];
        const result = await pool.query(query, values);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error updating customer profile:', error);
      throw error;
    }
  }

  // Soft delete customer
  async softDeleteCustomer(customerId) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_profiles')
          .update({
            soft_deleted: true,
            soft_deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', customerId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          UPDATE customer_profiles 
          SET soft_deleted = true, soft_deleted_at = NOW(), updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;

        const result = await pool.query(query, [customerId]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error soft deleting customer:', error);
      throw error;
    }
  }

  /**
   * Customer Notes Methods
   */

  // Add customer note
  async addCustomerNote(customerId, noteData) {
    try {
      const {
        admin_id,
        note,
        note_type = 'general',
        is_private = true
      } = noteData;

      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_notes')
          .insert({
            customer_id: customerId,
            admin_id,
            note,
            note_type,
            is_private
          })
          .select(`
            *,
            admin:admin_id (
              first_name,
              last_name,
              email
            )
          `)
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO customer_notes (customer_id, admin_id, note, note_type, is_private)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const result = await pool.query(query, [customerId, admin_id, note, note_type, is_private]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error adding customer note:', error);
      throw error;
    }
  }

  // Get customer notes
  async getCustomerNotes(customerId, options = {}) {
    const { page = 1, limit = 50, note_type = '' } = options;
    const offset = (page - 1) * limit;

    try {
      if (this.useSupabase) {
        let query = supabase
          .from('customer_notes')
          .select(`
            *,
            admin:admin_id (
              first_name,
              last_name,
              email
            )
          `, { count: 'exact' })
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (note_type) {
          query = query.eq('note_type', note_type);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
          notes: data || [],
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        };
      } else {
        // Fallback to PostgreSQL
        let whereConditions = ['customer_id = $1'];
        let params = [customerId];

        if (note_type) {
          whereConditions.push('note_type = $2');
          params.push(note_type);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM customer_notes WHERE ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Get notes
        const dataQuery = `
          SELECT cn.*, u.first_name, u.last_name, u.email
          FROM customer_notes cn
          JOIN users u ON cn.admin_id = u.id
          WHERE ${whereClause}
          ORDER BY cn.created_at DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        params.push(limit, offset);
        const dataResult = await pool.query(dataQuery, params);

        return {
          notes: dataResult.rows,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };
      }
    } catch (error) {
      console.error('Error getting customer notes:', error);
      throw error;
    }
  }

  /**
   * Customer Tags Methods
   */

  // Get all customer tags
  async getCustomerTags() {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_tags')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      } else {
        // Fallback to PostgreSQL
        const query = 'SELECT * FROM customer_tags ORDER BY name';
        const result = await pool.query(query);
        return result.rows;
      }
    } catch (error) {
      console.error('Error getting customer tags:', error);
      throw error;
    }
  }

  // Add tag to customer
  async addCustomerTag(customerId, tagId, adminId) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_tag_map')
          .insert({
            customer_id: customerId,
            tag_id: tagId,
            assigned_by: adminId,
            assigned_at: new Date().toISOString()
          })
          .select(`
            *,
            tag:customer_tags (
              id,
              name,
              color,
              description
            )
          `)
          .single();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          INSERT INTO customer_tag_map (customer_id, tag_id, assigned_by, assigned_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (customer_id, tag_id) DO NOTHING
          RETURNING *
        `;

        const result = await pool.query(query, [customerId, tagId, adminId]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error adding customer tag:', error);
      throw error;
    }
  }

  // Remove tag from customer
  async removeCustomerTag(customerId, tagId) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_tag_map')
          .delete()
          .eq('customer_id', customerId)
          .eq('tag_id', tagId)
          .select();

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const query = `
          DELETE FROM customer_tag_map 
          WHERE customer_id = $1 AND tag_id = $2
          RETURNING *
        `;

        const result = await pool.query(query, [customerId, tagId]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error removing customer tag:', error);
      throw error;
    }
  }

  /**
   * Customer Segmentation Methods
   */

  // Get all customer segments
  async getCustomerSegments() {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .from('customer_segments')
          .select(`
            *,
            customer_segment_rules (
              id,
              field,
              operator,
              value,
              condition_type,
              sort_order
            )
          `)
          .order('name');

        if (error) throw error;
        return data || [];
      } else {
        // Fallback to PostgreSQL
        const query = `
          SELECT cs.*, 
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', csr.id,
                  'field', csr.field,
                  'operator', csr.operator,
                  'value', csr.value,
                  'condition_type', csr.condition_type,
                  'sort_order', csr.sort_order
                )
              ) FILTER (WHERE csr.id IS NOT NULL),
              '[]'::json
            ) as rules
          FROM customer_segments cs
          LEFT JOIN customer_segment_rules csr ON cs.id = csr.segment_id
          GROUP BY cs.id
          ORDER BY cs.name
        `;

        const result = await pool.query(query);
        return result.rows;
      }
    } catch (error) {
      console.error('Error getting customer segments:', error);
      throw error;
    }
  }

  // Create customer segment
  async createCustomerSegment(segmentData) {
    try {
      const {
        name,
        description,
        is_active = true,
        is_dynamic = false,
        created_by,
        rules = []
      } = segmentData;

      if (this.useSupabase) {
        // Create segment
        const { data: segment, error: segmentError } = await supabase
          .from('customer_segments')
          .insert({
            name,
            description,
            is_active,
            is_dynamic,
            created_by
          })
          .select()
          .single();

        if (segmentError) throw segmentError;

        // Add rules if provided
        if (rules.length > 0) {
          const rulesData = rules.map((rule, index) => ({
            segment_id: segment.id,
            ...rule,
            sort_order: index
          }));

          const { error: rulesError } = await supabase
            .from('customer_segment_rules')
            .insert(rulesData);

          if (rulesError) throw rulesError;
        }

        return segment;
      } else {
        // Fallback to PostgreSQL
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Create segment
          const segmentQuery = `
            INSERT INTO customer_segments (name, description, is_active, is_dynamic, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;

          const segmentResult = await client.query(segmentQuery, [
            name, description, is_active, is_dynamic, created_by
          ]);
          const segment = segmentResult.rows[0];

          // Add rules if provided
          if (rules.length > 0) {
            for (let i = 0; i < rules.length; i++) {
              const rule = rules[i];
              const ruleQuery = `
                INSERT INTO customer_segment_rules (segment_id, field, operator, value, condition_type, sort_order)
                VALUES ($1, $2, $3, $4, $5, $6)
              `;

              await client.query(ruleQuery, [
                segment.id, rule.field, rule.operator, rule.value, rule.condition_type, i
              ]);
            }
          }

          await client.query('COMMIT');
          return segment;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    } catch (error) {
      console.error('Error creating customer segment:', error);
      throw error;
    }
  }

  // Update dynamic segments
  async updateDynamicSegments() {
    try {
      if (this.useSupabase) {
        // Call the database function
        const { data, error } = await supabase
          .rpc('update_dynamic_segments');

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const result = await pool.query('SELECT update_dynamic_segments()');
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error updating dynamic segments:', error);
      throw error;
    }
  }

  // Get customers in segment
  async getSegmentCustomers(segmentId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    try {
      if (this.useSupabase) {
        const { data, error, count } = await supabase
          .from('customer_segment_memberships')
          .select(`
            customer:customer_profiles (
              *,
              users:user_id (
                email,
                first_name,
                last_name,
                phone
              )
            )
          `, { count: 'exact' })
          .eq('segment_id', segmentId)
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
          customers: data?.map(item => item.customer) || [],
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        };
      } else {
        // Fallback to PostgreSQL
        const query = `
          SELECT 
            cp.*,
            u.email,
            u.first_name,
            u.last_name,
            u.phone
          FROM customer_segment_memberships csm
          JOIN customer_profiles cp ON csm.customer_id = cp.id
          JOIN users u ON cp.user_id = u.id
          WHERE csm.segment_id = $1
          ORDER BY csm.added_at DESC
          LIMIT $2 OFFSET $3
        `;

        const dataResult = await pool.query(query, [segmentId, limit, offset]);

        const countQuery = `
          SELECT COUNT(*) 
          FROM customer_segment_memberships 
          WHERE segment_id = $1
        `;
        const countResult = await pool.query(countQuery, [segmentId]);
        const total = parseInt(countResult.rows[0].count);

        return {
          customers: dataResult.rows,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        };
      }
    } catch (error) {
      console.error('Error getting segment customers:', error);
      throw error;
    }
  }

  /**
   * Customer Analytics Methods
   */

  // Get customer analytics dashboard data
  async getCustomerAnalytics(dateRange = '30') {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      if (this.useSupabase) {
        // Get customer metrics
        const { data: metrics, error: metricsError } = await supabase
          .from('customer_profiles')
          .select('lifecycle_stage')
          .gte('created_at', startDate.toISOString())
          .eq('soft_deleted', false);

        if (metricsError) throw metricsError;

        // Get segment data
        const { data: segments, error: segmentsError } = await supabase
          .from('customer_segments')
          .select('name, customer_count')
          .eq('is_active', true);

        if (segmentsError) throw segmentsError;

        // Calculate lifecycle stages
        const lifecycleStages = metrics.reduce((acc, customer) => {
          acc[customer.lifecycle_stage] = (acc[customer.lifecycle_stage] || 0) + 1;
          return acc;
        }, {});

        return {
          totalCustomers: metrics.length,
          newCustomers: metrics.filter(c => c.created_at >= startDate.toISOString()).length,
          lifecycleStages,
          segments: segments || []
        };
      } else {
        // Fallback to PostgreSQL
        const query = `
          SELECT 
            COUNT(*) as total_customers,
            COUNT(*) FILTER (WHERE created_at >= $1) as new_customers,
            COUNT(*) FILTER (WHERE lifecycle_stage = 'lead') as leads,
            COUNT(*) FILTER (WHERE lifecycle_stage = 'active') as active,
            COUNT(*) FILTER (WHERE lifecycle_stage = 'inactive') as inactive,
            COUNT(*) FILTER (WHERE lifecycle_stage = 'vip') as vip,
            COUNT(*) FILTER (WHERE lifecycle_stage = 'churned') as churned,
            COALESCE(SUM(total_spend), 0) as total_revenue,
            COALESCE(AVG(total_spend), 0) as avg_customer_value
          FROM customer_profiles 
          WHERE soft_deleted = false
        `;

        const result = await pool.query(query, [startDate]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error getting customer analytics:', error);
      throw error;
    }
  }

  // Update customer metrics (triggered by orders)
  async updateCustomerMetrics(customerId) {
    try {
      if (this.useSupabase) {
        const { data, error } = await supabase
          .rpc('update_customer_metrics', { customer_uuid: customerId });

        if (error) throw error;
        return data;
      } else {
        // Fallback to PostgreSQL
        const result = await pool.query('SELECT update_customer_metrics($1)', [customerId]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error updating customer metrics:', error);
      throw error;
    }
  }
}

module.exports = new CRMService();
