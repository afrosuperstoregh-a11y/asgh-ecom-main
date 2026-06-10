const { createClient } = require('@supabase/supabase-js')
const ws = require('ws')
const config = require('../config/env')
const { ApiResponse } = require('./apiResponse')
const { pool } = require('../config/database')

// Validate environment variables before initializing Supabase client
if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  console.error('❌ Missing required Supabase environment variables')
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  throw new Error('Missing Supabase environment variables')
}

// Initialize Supabase client for JWT verification (Realtime disabled - not used in backend)
let supabase
try {
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: ws
    }
  })
  console.log('✅ Supabase client initialized successfully')
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:')
  console.error('   File: supabaseAuth.js')
  console.error('   Line: 15')
  console.error('   Error:', error.message)
  console.error('   Stack:', error.stack)
  console.error('   Supabase URL:', config.supabase.url ? '✓ Configured' : '✗ Missing')
  console.error('   Service Role Key:', config.supabase.serviceRoleKey ? '✓ Configured' : '✗ Missing')
  console.error('   Supabase SDK Version: @supabase/supabase-js@^2.105.3')
  console.error('\n   Please check your environment variables and Supabase configuration.')
  process.exit(1)
}

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
    if (!pool) {
      console.warn('⚠️  Direct PostgreSQL connection not available - using Supabase auth only')
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'customer',
        first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || null,
        last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ')[1] || null,
        email_verified: !!user.email_confirmed_at,
        phone: user.phone,
        is_admin: false,
        admin_permissions: null,
        created_at: user.created_at
      }
      return next()
    }

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
