const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');

class AuthService {
  // Use Supabase Auth as single source of truth
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile from database
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        user: {
          ...data.user,
          profile
        },
        session: data.session
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async signUp(userData) {
    try {
      const { email, password, firstName, lastName, role = 'customer' } = userData;

      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role
          }
        }
      });

      if (error) throw error;

      // Create user profile in database
      if (data.user) {
        await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role,
            created_at: new Date().toISOString()
          });
      }

      return data;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        ...user,
        profile
      };
    } catch (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
  }

  // Generate server-side token for API access
  generateServerToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.profile?.role || 'customer'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Verify server-side token
  verifyServerToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
