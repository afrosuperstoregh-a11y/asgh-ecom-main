// Dummy product data for ecommerce platform
export const products = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    brand: "SoundPro",
    sku: "SP-WH-2025",
    price: 199.99,
    originalPrice: 249.99,
    discount: 20,
    description: "Experience premium sound quality with our flagship wireless headphones. Featuring advanced noise cancellation, 30-hour battery life, and superior comfort for all-day wear.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1487215078520-e0cc1d44c623?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&auto=format"
    ],
    category: "Electronics",
    rating: 4.5,
    reviews: 128,
    stockStatus: "In Stock",
    stock: 45,
    variants: {
      colors: [
        { name: "Black", value: "#000000", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop" },
        { name: "Silver", value: "#C0C0C0", image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop" },
        { name: "Blue", value: "#0066CC", image: "https://images.unsplash.com/photo-1487215078520-e0cc1d44c623?w=800&h=800&fit=crop" }
      ],
      sizes: [
        { name: "Standard", value: "standard" }
      ]
    },
    highlights: [
      "Active Noise Cancellation (ANC)",
      "30-hour battery life with quick charge",
      "Premium leather ear cushions",
      "Bluetooth 5.0 connectivity",
      "Built-in microphone for calls",
      "Foldable design with carrying case"
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 20kHz",
      "Impedance": "32 Ohms",
      "Battery Life": "30 hours",
      "Charging Time": "2 hours",
      "Wireless Range": "30 feet",
      "Weight": "250g"
    },
    shipping: {
      delivery: "Free delivery by Tomorrow",
      returns: "30-day return policy",
      warranty: "2-year manufacturer warranty"
    },
    reviewsData: [
      {
        id: 1,
        user: "John D.",
        rating: 5,
        date: "2024-12-15",
        comment: "Amazing sound quality! The noise cancellation is incredible, and the battery life exceeds expectations.",
        verified: true
      },
      {
        id: 2,
        user: "Sarah M.",
        rating: 4,
        date: "2024-12-10",
        comment: "Great headphones overall. Very comfortable for long listening sessions. Only minor issue is the carrying case could be more durable.",
        verified: true
      },
      {
        id: 3,
        user: "Mike R.",
        rating: 5,
        date: "2024-12-05",
        comment: "Best headphones I've ever owned. The sound quality is crystal clear and the build quality is premium.",
        verified: true
      }
    ],
    relatedProducts: [2, 3, 5]
  },
  {
    id: 2,
    name: "Organic Cotton T-Shirt",
    brand: "EcoWear",
    sku: "EW-OT-2025",
    price: 29.99,
    originalPrice: 39.99,
    discount: 25,
    description: "Sustainable and comfortable organic cotton t-shirt perfect for everyday wear.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&auto=format"
    ],
    category: "Clothing",
    rating: 4.8,
    reviews: 89,
    stockStatus: "In Stock",
    stock: 120,
    variants: {
      colors: [
        { name: "White", value: "#FFFFFF" },
        { name: "Black", value: "#000000" },
        { name: "Gray", value: "#808080" }
      ],
      sizes: [
        { name: "Small", value: "S" },
        { name: "Medium", value: "M" },
        { name: "Large", value: "L" },
        { name: "X-Large", value: "XL" }
      ]
    },
    highlights: [
      "100% GOTS certified organic cotton",
      "Ethically made",
      "Machine washable",
      "Pre-shrunk fabric",
      "Tag-free label"
    ],
    relatedProducts: [1, 4]
  },
  {
    id: 3,
    name: "Smart Watch Pro",
    brand: "TechGear",
    sku: "TG-SW-2025",
    price: 399.99,
    originalPrice: 499.99,
    discount: 20,
    description: "Advanced fitness tracking and health monitoring smartwatch with stunning display.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop"
    ],
    category: "Electronics",
    rating: 4.7,
    reviews: 256,
    stockStatus: "In Stock",
    stock: 78,
    variants: {
      colors: [
        { name: "Black", value: "#000000" },
        { name: "Silver", value: "#C0C0C0" }
      ],
      sizes: [
        { name: "42mm", value: "42mm" },
        { name: "46mm", value: "46mm" }
      ]
    },
    relatedProducts: [1, 6]
  },
  {
    id: 4,
    name: "Eco-Friendly Water Bottle",
    brand: "GreenLife",
    sku: "GL-WB-2025",
    price: 24.99,
    originalPrice: 34.99,
    discount: 29,
    description: "Reusable stainless steel water bottle with temperature retention.",
    image: "https://images.unsplash.com/photo-1602143407151-71124268d72d?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1602143407151-71124268d72d?w=800&h=800&fit=crop"
    ],
    category: "Home & Living",
    rating: 4.6,
    reviews: 167,
    stockStatus: "In Stock",
    stock: 200,
    variants: {
      colors: [
        { name: "Stainless Steel", value: "#C0C0C0" },
        { name: "Matte Black", value: "#333333" },
        { name: "Ocean Blue", value: "#006994" }
      ],
      sizes: [
        { name: "500ml", value: "500ml" },
        { name: "750ml", value: "750ml" },
        { name: "1L", value: "1000ml" }
      ]
    },
    relatedProducts: [2, 6]
  },
  {
    id: 5,
    name: "Leather Backpack",
    brand: "UrbanStyle",
    sku: "US-LB-2025",
    price: 149.99,
    originalPrice: 199.99,
    discount: 25,
    description: "Genuine leather backpack with laptop compartment and premium finish.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop"
    ],
    category: "Accessories",
    rating: 4.9,
    reviews: 203,
    stockStatus: "In Stock",
    stock: 35,
    variants: {
      colors: [
        { name: "Brown", value: "#8B4513" },
        { name: "Black", value: "#000000" }
      ],
      sizes: [
        { name: "One Size", value: "one-size" }
      ]
    },
    relatedProducts: [1, 3]
  },
  {
    id: 6,
    name: "Yoga Mat Premium",
    brand: "ZenFit",
    sku: "ZF-YM-2025",
    price: 79.99,
    originalPrice: 99.99,
    discount: 20,
    description: "Non-slip exercise yoga mat with carrying strap and alignment markers.",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=800&fit=crop"
    ],
    category: "Sports",
    rating: 4.4,
    reviews: 145,
    stockStatus: "In Stock",
    stock: 90,
    variants: {
      colors: [
        { name: "Purple", value: "#9B59B6" },
        { name: "Blue", value: "#3498DB" },
        { name: "Green", value: "#27AE60" }
      ],
      sizes: [
        { name: "Standard", value: "standard" }
      ]
    },
    relatedProducts: [2, 4]
  }
];
