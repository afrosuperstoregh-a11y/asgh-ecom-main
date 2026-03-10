const orderService = require('../services/orderService');
const { validateOrder } = require('../utils/validation');

class OrderController {
  async createOrder(req, res) {
    try {
      const { error } = validateOrder(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.details[0].message
        });
      }

      const order = await orderService.createOrder(req.body, req.user.id);
      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create order'
      });
    }
  }

  async getOrders(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const orders = await orderService.getOrders(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch orders'
      });
    }
  }

  async getOrderById(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch order'
      });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status, req.user.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order status updated successfully'
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update order status'
      });
    }
  }

  async cancelOrder(req, res) {
    try {
      const order = await orderService.cancelOrder(req.params.id, req.user.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel order error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to cancel order'
      });
    }
  }
}

module.exports = new OrderController();
