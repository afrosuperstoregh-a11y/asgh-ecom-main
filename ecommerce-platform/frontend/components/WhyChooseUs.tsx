'use client';

import { Truck, Leaf, CreditCard, Headphones } from 'lucide-react';

export default function WhyChooseUs() {
  const features = [
    {
      icon: Truck,
      title: "Fast Shipping",
      description: "Free delivery on orders over $50. Get your products in 2-3 business days."
    },
    {
      icon: Leaf,
      title: "Eco Friendly",
      description: "Sustainable packaging and environmentally conscious product selection."
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Multiple payment options with bank-level security and fraud protection."
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock customer service to help you with any questions or concerns."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
          <p className="text-lg text-gray-600">We're committed to providing the best shopping experience</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
