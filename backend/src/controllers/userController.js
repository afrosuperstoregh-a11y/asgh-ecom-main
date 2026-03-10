const userService = require('../services/userService');
const { validateUserUpdate } = require('../utils/validation');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await userService.getUserById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch user profile'
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { error } = validateUserUpdate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message
        });
      }

      const user = await userService.updateUser(req.user.id, req.body);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          updatedAt: user.updated_at
        },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update profile'
      });
    }
  }

  async deleteAccount(req, res) {
    try {
      const success = await userService.deleteUser(req.user.id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete account'
      });
    }
  }

  async getUserAddresses(req, res) {
    try {
      const addresses = await userService.getUserAddresses(req.user.id);
      res.json({
        success: true,
        data: addresses
      });
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch addresses'
      });
    }
  }

  async addAddress(req, res) {
    try {
      const address = await userService.addAddress(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: address,
        message: 'Address added successfully'
      });
    } catch (error) {
      console.error('Add address error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to add address'
      });
    }
  }

  async updateAddress(req, res) {
    try {
      const address = await userService.updateAddress(req.params.addressId, req.user.id, req.body);
      
      if (!address) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Address not found'
        });
      }

      res.json({
        success: true,
        data: address,
        message: 'Address updated successfully'
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update address'
      });
    }
  }

  async deleteAddress(req, res) {
    try {
      const success = await userService.deleteAddress(req.params.addressId, req.user.id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Address not found'
        });
      }

      res.json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete address'
      });
    }
  }
}

module.exports = new UserController();
