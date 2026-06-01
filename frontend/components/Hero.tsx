'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Discover Amazing Products at Great Prices
            </h1>
            <p className="text-xl mb-8 text-indigo-100">
              Shop our curated collection of premium products with fast shipping and exceptional customer service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                Shop Now
              </button>
              <button className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors">
                View Deals
              </button>
            </div>
          </div>
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
              alt="Hero product showcase"
              width={600}
              height={400}
              className="rounded-lg shadow-2xl w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
