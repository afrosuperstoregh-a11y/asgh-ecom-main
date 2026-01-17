'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  backgroundImage?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = "Welcome to Our Store",
  subtitle = "Discover Amazing Products",
  description = "Shop our curated collection of premium products at unbeatable prices. From fashion to electronics, we have everything you need.",
  ctaText = "Shop Now",
  backgroundImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=600&fit=crop"
}) => {
  return (
    <div className="relative h-[600px] w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {title}
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-6">
            {subtitle}
          </h2>
          <p className="text-lg md:text-xl text-white mb-8 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
          <Button 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            {ctaText}
          </Button>
        </div>
      </div>

      {/* Gradient Overlay for better text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};
