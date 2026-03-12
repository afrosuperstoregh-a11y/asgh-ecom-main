import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase/server'
import { createError } from './errorHandler'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        role: string
      }
    }
  }
}

// JWT verification middleware
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401, 'MISSING_TOKEN')
    }

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw createError('Invalid or expired token', 401, 'INVALID_TOKEN')
    }

    // Get user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw createError('User profile not found', 401, 'PROFILE_NOT_FOUND')
    }

    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email || '',
      role: profile.role || 'customer'
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Admin role verification middleware
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401, 'AUTH_REQUIRED')
    }

    if (req.user.role !== 'admin') {
      throw createError('Admin access required', 403, 'ADMIN_REQUIRED')
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (!error && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        req.user = {
          userId: user.id,
          email: user.email || '',
          role: profile?.role || 'customer'
        }
      }
    }

    next()
  } catch (error) {
    // Don't fail the request for optional auth
    next()
  }
}
