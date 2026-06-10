const { pool } = require('../config/database');

// Create audit log table if it doesn't exist
async function createAuditLogTable() {
  if (!pool) {
    console.log('ℹ️  Direct PostgreSQL connection not available - skipping audit log table creation');
    return;
  }

  const query = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      admin_email VARCHAR(255) NOT NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INTEGER,
      old_values JSONB,
      new_values JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `;
  
  try {
    await pool.query(query);
    console.log('✅ Audit log table ready');
  } catch (error) {
    console.error('❌ Error creating audit log table:', error.message);
    if (error.code === 'ENETUNREACH' || error.code === 'ECONNREFUSED') {
      console.warn('⚠️  Network error - audit log table creation skipped');
    }
  }
}

// Log admin action
async function logAdminAction({
  adminId,
  adminEmail,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null
}) {
  if (!pool) {
    console.warn('⚠️  Direct PostgreSQL connection not available - skipping audit log');
    return null;
  }

  try {
    const query = `
      INSERT INTO audit_logs (
        admin_id, admin_email, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      adminId,
      adminEmail,
      action,
      entityType,
      entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress,
      userAgent
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw error to avoid breaking main functionality
    return null;
  }
}

// Get audit logs (admin only)
async function getAuditLogs(filters = {}) {
  if (!pool) {
    console.warn('⚠️  Direct PostgreSQL connection not available - cannot fetch audit logs');
    return [];
  }

  try {
    let query = `
      SELECT 
        al.*,
        u.first_name,
        u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.admin_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (filters.adminId) {
      query += ` AND al.admin_id = $${paramIndex++}`;
      params.push(filters.adminId);
    }
    
    if (filters.action) {
      query += ` AND al.action = $${paramIndex++}`;
      params.push(filters.action);
    }
    
    if (filters.entityType) {
      query += ` AND al.entity_type = $${paramIndex++}`;
      params.push(filters.entityType);
    }
    
    if (filters.entityId) {
      query += ` AND al.entity_id = $${paramIndex++}`;
      params.push(filters.entityId);
    }
    
    if (filters.startDate) {
      query += ` AND al.created_at >= $${paramIndex++}`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ` AND al.created_at <= $${paramIndex++}`;
      params.push(filters.endDate);
    }
    
    query += ` ORDER BY al.created_at DESC`;
    
    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

// Middleware to automatically log admin actions
function auditLog(action, entityType) {
  return (req, res, next) => {
    // Store original res.json function
    const originalJson = res.json;
    
    // Override res.json to log after response
    res.json = function(data) {
      // Only log successful operations
      if (res.statusCode < 300 && req.user) {
        logAdminAction({
          adminId: req.user.id,
          adminEmail: req.user.email,
          action,
          entityType,
          entityId: req.params.id || null,
          oldValues: req.oldData || null,
          newValues: req.body || null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        }).catch(err => {
          console.error('Audit log error:', err);
        });
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  };
}

module.exports = {
  logAdminAction,
  getAuditLogs,
  auditLog,
  createAuditLogTable
};
