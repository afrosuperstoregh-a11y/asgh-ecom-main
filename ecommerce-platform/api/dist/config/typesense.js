"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTypesense = exports.typesenseService = void 0;
const typesense_1 = __importDefault(require("typesense"));
class TypesenseService {
    constructor() {
        this.client = new typesense_1.default.Client({
            nodes: [
                {
                    host: process.env.TYPESENSE_HOST || 'localhost',
                    port: parseInt(process.env.TYPESENSE_PORT || '8108'),
                    protocol: process.env.TYPESENSE_PROTOCOL || 'http'
                }
            ],
            apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
            connectionTimeoutSeconds: 2,
            numRetries: 3,
            retryIntervalSeconds: 0.1,
            logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
        });
    }
    getClient() {
        return this.client;
    }
    // Initialize product collection schema
    async initializeProductCollection() {
        const schema = {
            name: 'products',
            fields: [
                { name: 'id', type: 'string' },
                { name: 'name', type: 'string', facet: false },
                { name: 'description', type: 'string' },
                { name: 'shortDesc', type: 'string' },
                { name: 'sku', type: 'string' },
                { name: 'price', type: 'float', facet: true },
                { name: 'comparePrice', type: 'float', facet: true },
                { name: 'stock', type: 'int32', facet: true },
                { name: 'categoryId', type: 'string', facet: true },
                { name: 'categoryName', type: 'string', facet: true },
                { name: 'categorySlug', type: 'string' },
                { name: 'tags', type: 'string[]', facet: true },
                { name: 'status', type: 'string', facet: true },
                { name: 'featured', type: 'bool', facet: true },
                { name: 'images', type: 'string[]' },
                { name: 'createdAt', type: 'int64', facet: false }
            ],
            default_sorting_field: 'createdAt'
        };
        try {
            // Check if collection exists
            await this.client.collections('products').retrieve();
            console.log('Products collection already exists');
        }
        catch (error) {
            if (error.httpStatus === 404) {
                // Create collection if it doesn't exist
                await this.client.collections().create(schema);
                console.log('Products collection created successfully');
            }
            else {
                console.error('Error checking/creating collection:', error);
            }
        }
    }
    // Index products in Typesense
    async indexProducts(products) {
        try {
            // Transform products for Typesense
            const transformedProducts = products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description || '',
                shortDesc: product.shortDesc || '',
                sku: product.sku,
                price: parseFloat(product.price.toString()),
                comparePrice: product.comparePrice ? parseFloat(product.comparePrice.toString()) : null,
                stock: product.stock || 0,
                categoryId: product.categoryId,
                categoryName: product.category?.name || '',
                categorySlug: product.category?.slug || '',
                tags: product.tags || [],
                status: product.status,
                featured: product.featured || false,
                images: product.images || [],
                createdAt: new Date(product.createdAt).getTime()
            }));
            // Index in batches to avoid overwhelming Typesense
            const batchSize = 100;
            for (let i = 0; i < transformedProducts.length; i += batchSize) {
                const batch = transformedProducts.slice(i, i + batchSize);
                await this.client.collections('products').documents().import(batch, { action: 'upsert' });
            }
            console.log(`Indexed ${transformedProducts.length} products in Typesense`);
        }
        catch (error) {
            console.error('Error indexing products:', error);
            throw error;
        }
    }
    // Search products
    async searchProducts(query, options = {}) {
        try {
            const searchParameters = {
                q: query,
                query_by: 'name,description,shortDesc,sku,tags',
                filter_by: this.buildFilterString(options.filters),
                sort_by: this.buildSortString(options.sort),
                facet_by: 'categoryId,categoryName,tags,featured,price',
                max_facet_values: 100,
                page: options.page || 1,
                per_page: options.limit || 20,
                num_typos: 2,
                typo_tokens_threshold: 1,
                drop_tokens_threshold: 1,
                enable_overrides: true,
                pre_segmented_query: false,
                pinned_hits: options.pinnedHits || [],
                hidden_hits: options.hiddenHits || []
            };
            const searchResults = await this.client.collections('products').documents().search(searchParameters);
            return {
                hits: searchResults.hits || [],
                found: searchResults.found || 0,
                out_of: searchResults.out_of || 0,
                page: searchResults.page || 1,
                per_page: searchResults.per_page || 20,
                facets: searchResults.facet_counts || [],
                time_ms: searchResults.search_time_ms || 0
            };
        }
        catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }
    // Get popular searches (for autocomplete/suggestions)
    async getPopularSearches(limit = 10) {
        try {
            // This would typically be implemented using Typesense analytics
            // For now, return empty array
            return [];
        }
        catch (error) {
            console.error('Error getting popular searches:', error);
            return [];
        }
    }
    // Get search suggestions
    async getSearchSuggestions(query, limit = 5) {
        try {
            const searchParameters = {
                q: query,
                query_by: 'name',
                limit: limit,
                prefix: 'true',
                drop_tokens_threshold: 1,
                typo_tokens_threshold: 1,
                num_typos: 1
            };
            const searchResults = await this.client.collections('products').documents().search(searchParameters);
            return searchResults.hits?.map((hit) => hit.document.name) || [];
        }
        catch (error) {
            console.error('Error getting search suggestions:', error);
            return [];
        }
    }
    // Update single product in search index
    async updateProduct(product) {
        try {
            const transformedProduct = {
                id: product.id,
                name: product.name,
                description: product.description || '',
                shortDesc: product.shortDesc || '',
                sku: product.sku,
                price: parseFloat(product.price.toString()),
                comparePrice: product.comparePrice ? parseFloat(product.comparePrice.toString()) : null,
                stock: product.stock || 0,
                categoryId: product.categoryId,
                categoryName: product.category?.name || '',
                categorySlug: product.category?.slug || '',
                tags: product.tags || [],
                status: product.status,
                featured: product.featured || false,
                images: product.images || [],
                createdAt: new Date(product.createdAt).getTime()
            };
            await this.client.collections('products').documents().upsert(transformedProduct);
        }
        catch (error) {
            console.error('Error updating product in search index:', error);
            throw error;
        }
    }
    // Delete product from search index
    async deleteProduct(productId) {
        try {
            await this.client.collections('products').documents(productId).delete();
        }
        catch (error) {
            console.error('Error deleting product from search index:', error);
            throw error;
        }
    }
    // Build filter string from filter object
    buildFilterString(filters = {}) {
        const filterParts = [];
        if (filters.categoryId) {
            filterParts.push(`categoryId:=${filters.categoryId}`);
        }
        if (filters.featured !== undefined) {
            filterParts.push(`featured:=${filters.featured}`);
        }
        if (filters.status) {
            filterParts.push(`status:=${filters.status}`);
        }
        if (filters.minPrice !== undefined) {
            filterParts.push(`price:=[${filters.minPrice}..]`);
        }
        if (filters.maxPrice !== undefined) {
            filterParts.push(`price:=[..${filters.maxPrice}]`);
        }
        if (filters.inStock !== undefined) {
            filterParts.push(`stock:>[0]`);
        }
        if (filters.tags && filters.tags.length > 0) {
            const tagFilters = filters.tags.map((tag) => `tags:=${tag}`);
            filterParts.push(`(${tagFilters.join(' || ')})`);
        }
        return filterParts.join(' && ');
    }
    // Build sort string from sort options
    buildSortString(sortOptions = {}) {
        const { sortBy = 'createdAt', sort = 'desc' } = sortOptions;
        // Map field names
        const fieldMap = {
            'price': 'price',
            'createdAt': 'createdAt',
            'name': 'name',
            'stock': 'stock'
        };
        const field = fieldMap[sortBy] || 'createdAt';
        return `${field}:${sort}`;
    }
    // Check Typesense health
    async healthCheck() {
        try {
            await this.client.health.retrieve();
            return true;
        }
        catch (error) {
            console.error('Typesense health check failed:', error);
            return false;
        }
    }
}
// Singleton instance
exports.typesenseService = new TypesenseService();
// Initialize Typesense
const initializeTypesense = async () => {
    try {
        await exports.typesenseService.initializeProductCollection();
        console.log('Typesense initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize Typesense:', error);
        // Don't throw error to allow app to start without Typesense
    }
};
exports.initializeTypesense = initializeTypesense;
