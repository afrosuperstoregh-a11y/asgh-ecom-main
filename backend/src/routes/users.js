const express = require('express');
const { verifySupabaseUser, requireAdmin } = require('../middleware/supabaseAuth');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get all users (admin only)
router.get('/', verifySupabaseUser, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, first_name, last_name, phone, role, email_verified, created_at FROM profiles ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user profile (authenticated user or admin)
router.get('/:id', verifySupabaseUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user can access this profile
    const canAccess = req.user.id === id || 
                    req.user.role === 'admin' || 
                    req.user.role === 'super_admin';
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const result = await pool.query(
      'SELECT id, user_id, first_name, last_name, phone, role, email_verified, created_at FROM profiles WHERE user_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Update user (self or admin only)
router.put('/:id', verifySupabaseUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if user can update this profile
    const canUpdate = req.user.id === id || 
                    req.user.role === 'admin' || 
                    req.user.role === 'super_admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    
    // Only admins can change role
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      delete updates.role;
      delete updates.email_verified;
    }
    
    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (!setClause) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const query = `
      UPDATE profiles 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING id, user_id, first_name, last_name, phone, role, email_verified, updated_at
    `;
    
    const values = [id, ...Object.values(updates)];
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user (admin only) - this will delete from Supabase auth
router.delete('/:id', verifySupabaseUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    // Check if user exists
    const existingUser = await pool.query('SELECT id, user_id FROM profiles WHERE user_id = $1', [id]);
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete from Supabase auth (this will cascade delete from profiles due to ON DELETE CASCADE)
    const { createClient } = require('@supabase/supabase-js');
    const config = require('../config/env');
    const ws = require('ws');
    
    const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      realtime: {
        ws: ws
      }
    });
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (error) {
      console.error('Error deleting user from Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user from authentication system'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Get current user profile
router.get('/me/profile', verifySupabaseUser, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, first_name, last_name, phone, role, email_verified, created_at FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update current user profile
router.put('/me/profile', verifySupabaseUser, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.id;
    delete updates.user_id;
    delete updates.role;
    delete updates.email_verified;
    delete updates.created_at;
    
    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    if (!setClause) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const query = `
      UPDATE profiles 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING id, user_id, first_name, last_name, phone, role, email_verified, updated_at
    `;
    
    const values = [req.user.id, ...Object.values(updates)];
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;
