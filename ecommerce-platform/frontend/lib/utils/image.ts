import React from 'react';
import Image, { type ImageProps } from 'next/image';
import { twMerge } from 'tailwind-merge';

interface OptimizedImageProps extends Omit<ImageProps, 'alt' | 'src'> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  quality = 75,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}: OptimizedImageProps) {
  const imageClasses = twMerge(
    'rounded-lg object-cover',
    className
  );

  return React.createElement(
    Image,
    {
      src,
      alt,
      className: imageClasses,
      priority,
      quality,
      sizes,
      ...props
    }
  );
}

export default OptimizedImage;
