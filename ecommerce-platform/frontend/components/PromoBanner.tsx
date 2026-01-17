'use client';

export default function PromoBanner() {
  return (
    <section className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Limited Time Offer!
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Get up to 30% off on selected items. Don't miss out on these amazing deals!
          </p>
          <button className="px-8 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg text-lg">
            Shop Sale
          </button>
        </div>
      </div>
    </section>
  );
}
