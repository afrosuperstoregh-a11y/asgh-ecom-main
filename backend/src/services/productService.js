const { supabase } = require('../config/supabase');

class ProductService {
  // Get products with pagination, filtering, and sorting
  async getProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'created_at',
        order = 'DESC',
        category,
        search,
        status = 'active',
        featured
      } = options;

      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('products')
        .select(`
          *,
          categories!inner(name, slug)
        `, { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (featured !== undefined) {
        query = query.eq('featured', featured);
      }

      if (category) {
        query = query.eq('categories.slug', category);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      // Apply sorting
      query = query.order(sort, { ascending: order === 'ASC' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        products: data || [],
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil((count || 0) / limit),
          total_items: count || 0,
          items_per_page: parseInt(limit),
          has_next: offset + limit < (count || 0),
          has_prev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  // Get single product by ID
  async getProductById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!inner(name, slug)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Product not found');
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  // Create new product
  async createProduct(productData, userId) {
    try {
      const {
        name,
        description,
        short_desc,
        sku,
        price,
        compare_price,
        cost,
        category_id,
        status = 'active',
        featured = false,
        stock = 0,
        track_inventory = true,
        weight = 0,
        tags = []
      } = productData;

      // Insert product
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          description,
          short_desc,
          sku,
          price: parseFloat(price),
          compare_price: compare_price ? parseFloat(compare_price) : null,
          cost: cost ? parseFloat(cost) : null,
          category_id,
          status,
          featured,
          stock: parseInt(stock),
          track_inventory,
          weight: parseFloat(weight),
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Handle tags if provided
      if (tags.length > 0) {
        await this.attachProductTags(data.id, tags);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  // Update product
  async updateProduct(id, productData, userId) {
    try {
      const updateData = {
        ...productData,
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      // Convert numeric fields
      if (updateData.price) updateData.price = parseFloat(updateData.price);
      if (updateData.compare_price) updateData.compare_price = parseFloat(updateData.compare_price);
      if (updateData.cost) updateData.cost = parseFloat(updateData.cost);
      if (updateData.stock) updateData.stock = parseInt(updateData.stock);
      if (updateData.weight) updateData.weight = parseFloat(updateData.weight);

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Product not found');
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  // Delete product
  async deleteProduct(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Product not found');
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  // Update product stock
  async updateStock(id, quantity, operation = 'set') {
    try {
      let query;
      
      if (operation === 'set') {
        query = supabase
          .from('products')
          .update({ stock: quantity, updated_at: new Date().toISOString() })
          .eq('id', id);
      } else if (operation === 'add') {
        query = supabase.rpc('increment_stock', { product_id: id, amount: quantity });
      } else if (operation === 'subtract') {
        query = supabase.rpc('decrement_stock', { product_id: id, amount: quantity });
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`Failed to update stock: ${error.message}`);
    }
  }

  // Attach tags to product
  async attachProductTags(productId, tags) {
    try {
      const tagRelations = tags.map(tag => ({
        product_id: productId,
        tag_id: typeof tag === 'string' ? tag : tag.id
      }));

      const { error } = await supabase
        .from('product_tags')
        .insert(tagRelations);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to attach tags: ${error.message}`);
    }
  }

  // Get product categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }
}

module.exports = new ProductService();
