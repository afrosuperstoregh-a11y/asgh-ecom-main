'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getProductImageUrl } from '../lib/images';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fallback?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  quality = 85,
  fallback = '/placeholder-product.svg',
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(() => getProductImageUrl(src, fallback));

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(fallback);
    }
  };

  const imageProps = {
    src: imageError ? fallback : imageSrc,
    alt,
    className,
    priority,
    sizes,
    quality,
    onError: handleError,
  };

  if (fill) {
    return <Image {...imageProps} fill />;
  }

  return (
    <Image
      {...imageProps}
      width={width || 500}
      height={height || 500}
    />
  );
}
