'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getProductImageUrl, getSafeImageUrl } from '../lib/images';

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
  loading?: 'eager' | 'lazy';
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
  loading,
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(() => {
    // First validate the URL, then get the Supabase URL
    const safeUrl = getSafeImageUrl(src, fallback);
    return getProductImageUrl(safeUrl, fallback);
  });

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(fallback);
    }
  };

  const imageProps = {
    src: imageError ? fallback : imageSrc,
    alt: alt || 'Image',
    className,
    priority,
    sizes,
    quality,
    onError: handleError,
    loading: loading || (priority ? 'eager' : 'lazy'),
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
