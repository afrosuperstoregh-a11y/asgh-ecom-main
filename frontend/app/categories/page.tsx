// app/categories/page.tsx
import Image from "next/image";
import Link from "next/link";
import { supabase } from "../../lib/supabase-client";

const getSupabaseImageUrl = (imageName: string) => {
  const { data } = supabase
    .storage
    .from('categories')
    .getPublicUrl(imageName);
  
  return data.publicUrl;
};

const categories = [
  {
    id: 1,
    name: "Men's Fashion",
    slug: "men",
    image: "men.png",
    count: 120,
  },
  {
    id: 2,
    name: "Women's Fashion",
    slug: "women",
    image: "women.png",
    count: 180,
  },
  {
    id: 3,
    name: "Electronics",
    slug: "electronics",
    image: "electronics.png",
    count: 95,
  },
  {
    id: 4,
    name: "Home & Living",
    slug: "home-living",
    image: "home.png",
    count: 140,
  },
  {
    id: 5,
    name: "Beauty & Health",
    slug: "beauty-health",
    image: "beauty.png",
    count: 75,
  },
  {
    id: 6,
    name: "Sports & Fitness",
    slug: "sports-fitness",
    image: "sports.png",
    count: 60,
  },
  {
    id: 7,
    name: "Food & Beverages",
    slug: "food-beverages",
    image: "food.png",
    count: 75,
  },
  {
    id: 8,
    name: "Jewelry & Accessories",
    slug: "jewelry-accessories",
    image: "Jewelry.png",
    count: 60,
  },
  {
    id: 9,
    name: "Books & Media",
    slug: "books-media",
    image: "books.png",
    count: 60,
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900">Shop by Category</h1>
          <p className="mt-2 text-gray-600">
            Explore our full range of products across all collections.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden"
            >
              <div className="relative h-56 w-full">
                <Image
                  src={getSupabaseImageUrl(category.image)}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-category.svg';
                  }}
                />
              </div>

              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {category.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {category.count} items
                </p>
                <span className="inline-block mt-4 text-sm font-medium text-red-600 group-hover:underline">
                  Shop Now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
