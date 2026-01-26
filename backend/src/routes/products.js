const express = require('express');
const router = express.Router();

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    brand: "SoundPro",
    sku: "SP-WH-2025",
    price: 199.99,
    originalPrice: 249.99,
    discount: 20,
    description: "Experience premium sound quality with our flagship wireless headphones.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    category: "Electronics",
    rating: 4.5,
    reviews: 128,
    stockStatus: "In Stock",
    stock: 45
  },
  {
    id: 2,
    name: "Organic Cotton T-Shirt",
    brand: "EcoWear",
    sku: "EW-OT-2025",
    price: 29.99,
    originalPrice: 39.99,
    discount: 25,
    description: "Sustainable and comfortable organic cotton t-shirt.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
    category: "Clothing",
    rating: 4.8,
    reviews: 89,
    stockStatus: "In Stock",
    stock: 120
  },
  {
    id: 3,
    name: "Smart Watch Pro",
    brand: "TechGear",
    sku: "TG-SW-2025",
    price: 399.99,
    originalPrice: 499.99,
    discount: 20,
    description: "Advanced fitness tracking and health monitoring smartwatch.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    category: "Electronics",
    rating: 4.7,
    reviews: 256,
    stockStatus: "In Stock",
    stock: 78
  }
];

// Get all products
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: mockProducts,
    count: mockProducts.length
  });
});

// Get single product
router.get('/:id', (req, res) => {
  const product = mockProducts.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
});

// Create product (admin)
router.post('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Product created successfully',
    data: req.body 
  });
});

// Update product (admin)
router.put('/:id', (req, res) => {
  res.json({ 
    success: true,
    message: `Product ${req.params.id} updated successfully` 
  });
});

// Delete product (admin)
router.delete('/:id', (req, res) => {
  res.json({ 
    success: true,
    message: `Product ${req.params.id} deleted successfully` 
  });
});

module.exports = router;
