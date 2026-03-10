import React from 'react';
import { Clock, Tag, TrendingDown } from 'lucide-react';

const DealsHero = () => {
  return (
    <div className="relative bg-gradient-to-r from-red-600 to-orange-600 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white text-red-600 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
              <Tag className="w-4 h-4" />
              LIMITED TIME OFFERS
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Hot Deals
            <span className="block text-3xl sm:text-4xl lg:text-5xl text-orange-200 mt-2">
              Save Up to 75%
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-orange-100 mb-8 max-w-3xl mx-auto">
            Don't miss out on these amazing deals! Premium products at unbeatable prices for a limited time only.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Flash Sales Ending Soon</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <TrendingDown className="w-5 h-5" />
              <span className="font-semibold">Lowest Prices Guaranteed</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-colors shadow-lg">
              Shop All Deals
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-red-600 transition-colors">
              View Categories
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold">50%+</div>
            <div className="text-orange-200 text-sm">Average Discount</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold">1000+</div>
            <div className="text-orange-200 text-sm">Products on Sale</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold">24/7</div>
            <div className="text-orange-200 text-sm">New Deals Added</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold">4.8★</div>
            <div className="text-orange-200 text-sm">Average Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsHero;
