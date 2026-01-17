'use client';

import { Star, Truck, Shield, RotateCcw } from 'lucide-react';

export default function TrustBar() {
  const trustItems = [
    {
      icon: Star,
      text: "4.8/5 Reviews",
      subtext: "From 10,000+ customers"
    },
    {
      icon: Truck,
      text: "Free Shipping",
      subtext: "On orders over $50"
    },
    {
      icon: Shield,
      text: "Secure Checkout",
      subtext: "SSL encrypted"
    },
    {
      icon: RotateCcw,
      text: "Easy Returns",
      subtext: "30-day policy"
    }
  ];

  return (
    <section className="bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8">
          {trustItems.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <item.icon className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="font-semibold text-gray-900">{item.text}</span>
              <span className="text-sm text-gray-600">{item.subtext}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
