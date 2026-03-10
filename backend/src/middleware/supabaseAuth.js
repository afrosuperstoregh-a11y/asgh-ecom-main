const { createClient } = require('@supabase/supabase-js')
const config = require('../config/env')

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
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    // Verify the JWT token using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('Supabase auth error:', error)
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if user's email is verified
    if (!user.email_confirmed_at) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified'
      })
    }

    // Get user profile from our database to include role information
    const { Pool } = require('pg')
    const pool = new Pool({
      connectionString: config.database.url,
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
    })

    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [user.id]
    )

    let profile = null
    if (profileResult.rows.length > 0) {
      profile = profileResult.rows[0]
    } else {
      // Create profile if it doesn't exist
      const newProfileResult = await pool.query(
        `INSERT INTO profiles (user_id, first_name, last_name, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          user.id,
          user.user_metadata?.first_name || null,
          user.user_metadata?.last_name || null,
          user.user_metadata?.role || 'customer',
          user.email_confirmed_at ? true : false
        ]
      )
      profile = newProfileResult.rows[0]
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email_verified: profile.email_verified,
      phone: profile.phone,
      created_at: profile.created_at
    }

    next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    })
  }
}

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    const userRole = req.user.role
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}

// Super admin only middleware
const requireSuperAdmin = requireRole(['super_admin'])

// Admin or super admin middleware
const requireAdmin = requireRole(['admin', 'super_admin'])

module.exports = {
  verifySupabaseUser,
  requireRole,
  requireSuperAdmin,
  requireAdmin
}
