class CmsService {
  constructor() {
    this.apiUrl = process.env.CMS_API_URL;
    this.apiKey = process.env.CMS_API_KEY;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // ==================== CONTENT MANAGEMENT ====================

  async getContent(contentType, options = {}) {
    try {
      const cacheKey = `${contentType}_${JSON.stringify(options)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const { limit = 10, offset = 0, filters = {}, sort = 'createdAt:desc' } = options;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort
      });

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await this.makeRequest(`/content/${contentType}?${params}`);
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error(`Error fetching ${contentType} content:`, error);
      throw error;
    }
  }

  async getContentById(contentType, id) {
    try {
      const cacheKey = `${contentType}_${id}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await this.makeRequest(`/content/${contentType}/${id}`);
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error(`Error fetching ${contentType} by ID:`, error);
      throw error;
    }
  }

  async createContent(contentType, data) {
    try {
      const response = await this.makeRequest(`/content/${contentType}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      // Clear cache for this content type
      this.clearCacheForContentType(contentType);

      return response;
    } catch (error) {
      console.error(`Error creating ${contentType} content:`, error);
      throw error;
    }
  }

  async updateContent(contentType, id, data) {
    try {
      const response = await this.makeRequest(`/content/${contentType}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      // Clear cache for this content type
      this.clearCacheForContentType(contentType);

      return response;
    } catch (error) {
      console.error(`Error updating ${contentType} content:`, error);
      throw error;
    }
  }

  async deleteContent(contentType, id) {
    try {
      const response = await this.makeRequest(`/content/${contentType}/${id}`, {
        method: 'DELETE'
      });

      // Clear cache for this content type
      this.clearCacheForContentType(contentType);

      return response;
    } catch (error) {
      console.error(`Error deleting ${contentType} content:`, error);
      throw error;
    }
  }

  // ==================== BLOG MANAGEMENT ====================

  async getBlogPosts(options = {}) {
    return this.getContent('blog', options);
  }

  async getBlogPost(slug) {
    return this.getContentById('blog', slug);
  }

  async getBlogCategories() {
    return this.getContent('blog-categories');
  }

  async getBlogPostsByCategory(categoryId, options = {}) {
    return this.getContent('blog', {
      ...options,
      filters: { ...options.filters, category: categoryId }
    });
  }

  // ==================== PRODUCT CONTENT ====================

  async getProductContent(productId) {
    try {
      const response = await this.makeRequest(`/content/products/${productId}`);
      return response;
    } catch (error) {
      console.error('Error fetching product content:', error);
      throw error;
    }
  }

  async getRelatedProducts(productId, limit = 4) {
    try {
      const response = await this.makeRequest(`/content/products/${productId}/related?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching related products:', error);
      throw error;
    }
  }

  // ==================== CAMPAIGN CONTENT ====================

  async getCampaignContent(campaignId) {
    try {
      const response = await this.makeRequest(`/content/campaigns/${campaignId}`);
      return response;
    } catch (error) {
      console.error('Error fetching campaign content:', error);
      throw error;
    }
  }

  async getLandingPages(options = {}) {
    return this.getContent('landing-pages', options);
  }

  async getLandingPage(slug) {
    return this.getContentById('landing-pages', slug);
  }

  // ==================== MEDIA MANAGEMENT ====================

  async uploadMedia(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${this.apiUrl}/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  async getMedia(options = {}) {
    return this.getContent('media', options);
  }

  // ==================== SEARCH ====================

  async search(query, options = {}) {
    try {
      const { contentType, limit = 10, offset = 0 } = options;
      
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (contentType) {
        params.append('contentType', contentType);
      }

      const response = await this.makeRequest(`/search?${params}`);
      return response;
    } catch (error) {
      console.error('Error searching CMS:', error);
      throw error;
    }
  }

  // ==================== WEBHOOK MANAGEMENT ====================

  async registerWebhook(eventType, url) {
    try {
      const response = await this.makeRequest('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          eventType,
          url,
          secret: process.env.CMS_WEBHOOK_SECRET
        })
      });

      return response;
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw error;
    }
  }

  async removeWebhook(webhookId) {
    try {
      const response = await this.makeRequest(`/webhooks/${webhookId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      console.error('Error removing webhook:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.apiUrl}${endpoint}`;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers
        },
        ...options
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`CMS API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('CMS API request failed:', error);
      throw error;
    }
  }

  clearCacheForContentType(contentType) {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${contentType}_`)) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // ==================== CONTENT TRANSFORMATION ====================

  transformBlogPost(cmsPost) {
    return {
      id: cmsPost.id,
      title: cmsPost.title,
      slug: cmsPost.slug,
      excerpt: cmsPost.excerpt,
      content: cmsPost.content,
      featuredImage: cmsPost.featured_image,
      author: cmsPost.author,
      publishedAt: cmsPost.published_at,
      updatedAt: cmsPost.updated_at,
      categories: cmsPost.categories || [],
      tags: cmsPost.tags || [],
      seo: {
        title: cmsPost.seo_title,
        description: cmsPost.seo_description,
        keywords: cmsPost.seo_keywords
      }
    };
  }

  transformProduct(cmsProduct) {
    return {
      id: cmsProduct.id,
      name: cmsProduct.name,
      slug: cmsProduct.slug,
      description: cmsProduct.description,
      shortDescription: cmsProduct.short_description,
      images: cmsProduct.images || [],
      specifications: cmsProduct.specifications || {},
      features: cmsProduct.features || [],
      videos: cmsProduct.videos || [],
      downloads: cmsProduct.downloads || [],
      relatedContent: cmsProduct.related_content || [],
      seo: {
        title: cmsProduct.seo_title,
        description: cmsProduct.seo_description,
        keywords: cmsProduct.seo_keywords
      }
    };
  }

  transformLandingPage(cmsPage) {
    return {
      id: cmsPage.id,
      title: cmsPage.title,
      slug: cmsPage.slug,
      content: cmsPage.content,
      heroSection: cmsPage.hero_section,
      sections: cmsPage.sections || [],
      metadata: cmsPage.metadata || {},
      seo: {
        title: cmsPage.seo_title,
        description: cmsPage.seo_description,
        keywords: cmsPage.seo_keywords
      }
    };
  }
}

module.exports = CmsService;
