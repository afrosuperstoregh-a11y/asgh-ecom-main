const { supabase } = require('../config/supabase');

class OrderService {
  async createOrder(orderData, userId) {
    try {
      const { items, shipping_address, payment_method, total_amount } = orderData;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          status: 'pending',
          total_amount,
          shipping_address,
          payment_method,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    } catch (error) {
      console.error('Create order service error:', error);
      throw error;
    }
  }

  async getOrders(userId, { page, limit, status }) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: orders, error } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return orders;
    } catch (error) {
      console.error('Get orders service error:', error);
      throw error;
    }
  }

  async getOrderById(orderId, userId) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(*)
          )
        `)
        .eq('id', orderId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return order;
    } catch (error) {
      console.error('Get order by ID service error:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, status, userId) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return order;
    } catch (error) {
      console.error('Update order status service error:', error);
      throw error;
    }
  }

  async cancelOrder(orderId, userId) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return order;
    } catch (error) {
      console.error('Cancel order service error:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();
