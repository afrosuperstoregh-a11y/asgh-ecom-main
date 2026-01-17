export const dealsData = {
  deals: [
    {
      id: 1,
      name: "Wireless Headphones",
      originalPrice: 299.99,
      discountedPrice: 149.99,
      discount: 50,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
      category: "Electronics",
      brand: "AudioTech",
      rating: 4.5,
      reviews: 234,
      stock: 15,
      dealEnds: "2024-12-31",
      badge: "Limited Time"
    },
    {
      id: 2,
      name: "Smart Watch",
      originalPrice: 399.99,
      discountedPrice: 249.99,
      discount: 38,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
      category: "Electronics",
      brand: "TechWatch",
      rating: 4.8,
      reviews: 512,
      stock: 8,
      dealEnds: "2024-12-25",
      badge: "Hot Deal"
    },
    {
      id: 3,
      name: "Yoga Mat",
      originalPrice: 79.99,
      discountedPrice: 39.99,
      discount: 50,
      image: "https://images.unsplash.com/photo-1545389336-cf0a69a4d0fb?w=500&h=500&fit=crop",
      category: "Fitness",
      brand: "FitGear",
      rating: 4.3,
      reviews: 128,
      stock: 25,
      dealEnds: "2024-12-30",
      badge: "50% OFF"
    }
  ],
  categories: [
    { id: 1, name: "Electronics", count: 2 },
    { id: 2, name: "Fitness", count: 1 }
  ],
  filters: {
    discountRanges: [
      { label: "10% - 25%", min: 10, max: 25 },
      { label: "25% - 50%", min: 25, max: 50 },
      { label: "50% - 75%", min: 50, max: 75 }
    ],
    priceRanges: [
      { label: "Under $50", min: 0, max: 50 },
      { label: "$50 - $100", min: 50, max: 100 },
      { label: "$100 - $200", min: 100, max: 200 },
      { label: "$200+", min: 200, max: null }
    ],
    brands: ["AudioTech", "TechWatch", "FitGear"]
  }
};
