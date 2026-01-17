export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  colors: string[];
  sizes: string[];
  images: string[];
  inStock: boolean;
  tags: string[];
  description: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Classic White T-Shirt",
    brand: "Essential Wear",
    category: "clothing",
    price: 29.99,
    discountPrice: 19.99,
    rating: 4.5,
    reviewCount: 234,
    colors: ["white", "black", "gray", "navy"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: ["sale"],
    description: "Premium quality cotton t-shirt perfect for everyday wear."
  },
  {
    id: "2",
    name: "Denim Jacket",
    brand: "Urban Style",
    category: "clothing",
    price: 89.99,
    rating: 4.8,
    reviewCount: 156,
    colors: ["blue", "black", "light-wash"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: ["new"],
    description: "Classic denim jacket with modern fit and styling."
  },
  {
    id: "3",
    name: "Running Sneakers",
    brand: "SportPro",
    category: "footwear",
    price: 129.99,
    discountPrice: 99.99,
    rating: 4.7,
    reviewCount: 412,
    colors: ["black", "white", "blue", "red"],
    sizes: ["7", "8", "9", "10", "11", "12"],
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: ["sale"],
    description: "High-performance running sneakers with advanced cushioning."
  },
  {
    id: "4",
    name: "Leather Handbag",
    brand: "Luxury Lane",
    category: "accessories",
    price: 249.99,
    rating: 4.9,
    reviewCount: 89,
    colors: ["brown", "black", "tan"],
    sizes: ["one-size"],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: ["new"],
    description: "Genuine leather handbag with elegant design and spacious interior."
  },
  {
    id: "5",
    name: "Wireless Headphones",
    brand: "SoundTech",
    category: "electronics",
    price: 199.99,
    discountPrice: 149.99,
    rating: 4.6,
    reviewCount: 523,
    colors: ["black", "white", "silver"],
    sizes: ["one-size"],
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: ["sale"],
    description: "Premium wireless headphones with noise cancellation."
  },
  {
    id: "6",
    name: "Yoga Mat",
    brand: "FitLife",
    category: "sports",
    price: 39.99,
    rating: 4.4,
    reviewCount: 178,
    colors: ["purple", "blue", "green", "pink"],
    sizes: ["standard"],
    images: [
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: [],
    description: "Non-slip yoga mat with extra cushioning for comfort."
  },
  {
    id: "7",
    name: "Coffee Maker",
    brand: "BrewMaster",
    category: "home",
    price: 79.99,
    rating: 4.3,
    reviewCount: 267,
    colors: ["black", "silver", "red"],
    sizes: ["one-size"],
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1517668808825-5e5a8f4b6b8b?w=400&h=500&fit=crop"
    ],
    inStock: false,
    tags: [],
    description: "Programmable coffee maker with thermal carafe."
  },
  {
    id: "8",
    name: "Sunglasses",
    brand: "ShadeCo",
    category: "accessories",
    price: 59.99,
    discountPrice: 39.99,
    rating: 4.5,
    reviewCount: 145,
    colors: ["black", "tortoise", "gold"],
    sizes: ["one-size"],
    images: [
      "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1511499767150-a48a237f11aa?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: ["sale"],
    description: "UV protection sunglasses with stylish frames."
  },
  {
    id: "9",
    name: "Winter Coat",
    brand: "WarmWear",
    category: "clothing",
    price: 159.99,
    rating: 4.7,
    reviewCount: 92,
    colors: ["black", "navy", "burgundy"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1544966503-7e3c4c6c5b0d?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: ["new"],
    description: "Warm winter coat with down insulation and water-resistant exterior."
  },
  {
    id: "10",
    name: "Smart Watch",
    brand: "TechTime",
    category: "electronics",
    price: 299.99,
    rating: 4.8,
    reviewCount: 334,
    colors: ["black", "silver", "rose-gold"],
    sizes: ["one-size"],
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: ["new"],
    description: "Advanced smartwatch with health tracking and notifications."
  },
  {
    id: "11",
    name: "Backpack",
    brand: "TravelGear",
    category: "accessories",
    price: 69.99,
    rating: 4.4,
    reviewCount: 201,
    colors: ["black", "gray", "navy", "olive"],
    sizes: ["one-size"],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: [],
    description: "Durable backpack with laptop compartment and multiple pockets."
  },
  {
    id: "12",
    name: "Running Shorts",
    brand: "SportPro",
    category: "clothing",
    price: 34.99,
    rating: 4.2,
    reviewCount: 123,
    colors: ["black", "blue", "red", "green"],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=500&fit=crop"
    ],
    inStock: true,
    tags: [],
    description: "Lightweight running shorts with moisture-wicking fabric."
  }
];

export const categories = [
  { id: "all-products", name: "All Products", count: products.length },
  { id: "clothing", name: "Clothing", count: products.filter(p => p.category === "clothing").length },
  { id: "footwear", name: "Footwear", count: products.filter(p => p.category === "footwear").length },
  { id: "accessories", name: "Accessories", count: products.filter(p => p.category === "accessories").length },
  { id: "electronics", name: "Electronics", count: products.filter(p => p.category === "electronics").length },
  { id: "sports", name: "Sports", count: products.filter(p => p.category === "sports").length },
  { id: "home", name: "Home", count: products.filter(p => p.category === "home").length }
];

export const brands = [...new Set(products.map(p => p.brand))].sort();

export const allColors = [...new Set(products.flatMap(p => p.colors))].sort();

export const allSizes = [...new Set(products.flatMap(p => p.sizes))].sort();
