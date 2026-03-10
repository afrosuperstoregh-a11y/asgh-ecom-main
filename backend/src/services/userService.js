const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class UserService {
  async getUserById(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return user;
    } catch (error) {
      console.error('Get user by ID service error:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const { first_name, last_name, phone } = updateData;

      const { data: user, error } = await supabase
        .from('users')
        .update({
          first_name,
          last_name,
          phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return user;
    } catch (error) {
      console.error('Update user service error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Delete user service error:', error);
      throw error;
    }
  }

  async getUserAddresses(userId) {
    try {
      const { data: addresses, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;

      return addresses;
    } catch (error) {
      console.error('Get user addresses service error:', error);
      throw error;
    }
  }

  async addAddress(userId, addressData) {
    try {
      const { street, city, state, postal_code, country, is_default } = addressData;

      // If this is set as default, unset other default addresses
      if (is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data: address, error } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          street,
          city,
          state,
          postal_code,
          country,
          is_default: is_default || false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return address;
    } catch (error) {
      console.error('Add address service error:', error);
      throw error;
    }
  }

  async updateAddress(addressId, userId, addressData) {
    try {
      const { street, city, state, postal_code, country, is_default } = addressData;

      // If this is set as default, unset other default addresses
      if (is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data: address, error } = await supabase
        .from('addresses')
        .update({
          street,
          city,
          state,
          postal_code,
          country,
          is_default: is_default || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return address;
    } catch (error) {
      console.error('Update address service error:', error);
      throw error;
    }
  }

  async deleteAddress(addressId, userId) {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Delete address service error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
