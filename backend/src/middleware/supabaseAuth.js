const { createClient } = require('@supabase/supabase-js')
const config = require('../config/env')
const { ApiResponse } = require('./apiResponse')

// Initialize Supabase client for JWT verification
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Supabase JWT verification middleware
const verifySupabaseUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return ApiResponse.unauthorized(res, 'Access token required')
    }

    // Verify the JWT token using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('Supabase auth error:', error)
      return ApiResponse.unauthorized(res, 'Invalid token')
    }

    if (!user) {
      return ApiResponse.unauthorized(res, 'User not found')
    }

    // Check if user's email is verified
    if (!user.email_confirmed_at) {
      return ApiResponse.unauthorized(res, 'Email not verified')
    }

    // Get user profile from our database to include role information
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: config.database.url,
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
    })

    // Check if user exists in our users table
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [user.id]
    )

    let userProfile = null
    if (userResult.rows.length > 0) {
      userProfile = userResult.rows[0]
    } else {
      // Create user record if it doesn't exist (sync from Supabase auth)
      const newUserResult = await pool.query(
        `INSERT INTO users (id, email, first_name, last_name, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          user.id,
          user.email,
          user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || null,
          user.user_metadata?.last_name || user.user_metadata?.name?.split(' ')[1] || null,
          user.user_metadata?.role || 'customer',
          user.email_confirmed_at ? true : false
        ]
      )
      userProfile = newUserResult.rows[0]
    }

    // Check if user is admin
    const adminResult = await pool.query(
      'SELECT * FROM admin_users WHERE user_id = $1',
      [user.id]
    )

    const isAdmin = adminResult.rows.length > 0

    // Add user info to request object
    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      email_verified: userProfile.email_verified,
      phone: userProfile.phone,
      is_admin: isAdmin,
      admin_permissions: isAdmin ? adminResult.rows[0].permissions : null,
      created_at: userProfile.created_at
    }

    next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return ApiResponse.error(res, 'Authentication error', 500, error.message)
  }
}

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Authentication required')
    }

    const userRole = req.user.role
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    if (!allowedRoles.includes(userRole)) {
      return ApiResponse.forbidden(res, 'Insufficient permissions')
    }

    next()
  }
}

// Super admin only middleware
const requireSuperAdmin = requireRole(['super_admin'])

// Admin or super admin middleware
const requireAdmin = requireRole(['admin', 'super_admin'])

// Check if user is admin (from admin_users table)
const requireAdminUser = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.unauthorized(res, 'Authentication required')
  }

  if (!req.user.is_admin) {
    return ApiResponse.forbidden(res, 'Admin access required')
  }

  next()
}

module.exports = {
  verifySupabaseUser,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireAdminUser
}
