import Image, { type ImageProps } from 'next/image';
import { twMerge } from 'tailwind-merge';

interface OptimizedImageProps extends Omit<ImageProps, 'alt' | 'src'> {
  src: string | StaticImport;
  alt: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width = 800,
  height = 600,
  priority = false,
  quality = 85,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}: OptimizedImageProps) {
  const imageSrc = typeof src === 'string' ? src : '';
  const isSvg = imageSrc.endsWith('.svg');
  
  if (isSvg) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={twMerge('w-full h-auto', className)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...(props as any)}
      />
    );
  }

  return (
    <div className={twMerge('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        sizes={sizes}
        priority={priority}
        className="w-full h-auto"
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
        {...props}
      />
    </div>
  );
}


// Helper to generate responsive image srcset
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 960, 1280, 1600, 1920],
  format: 'webp' | 'jpg' | 'png' = 'webp'
): string {
  return widths
    .map((width) => {
      const params = new URLSearchParams({
        w: width.toString(),
        q: '85',
        format,
      });
      return `${baseUrl}?${params} ${width}w`;
    })
    .join(', ');
}

// Helper to generate responsive image sizes attribute
export function generateSizes(
  breakpoints: Record<string, string> = {
    '(max-width: 640px)': '100vw',
    '(max-width: 1024px)': '50vw',
    '(min-width: 1025px)': '33vw',
  }
): string {
  return Object.entries(breakpoints)
    .map(([query, size]) => `${query} ${size}`)
    .join(', ');
}

declare global {
  interface Window {
    lazyLoadBackgroundImages: () => void;
  }
}

// Lazy load background images with Intersection Observer
export function lazyLoadBackgroundImages(): void {
  if (typeof window === 'undefined') return;

  const lazyBackgrounds = document.querySelectorAll('.lazy-bg');
  
  if ('IntersectionObserver' in window) {
    const lazyBackgroundObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const bgImage = target.getAttribute('data-bg');
          if (bgImage) {
            target.style.backgroundImage = `url(${bgImage})`;
            target.classList.remove('lazy-bg');
            lazyBackgroundObserver.unobserve(target);
          }
        }
      });
    });

    lazyBackgrounds.forEach((lazyBackground) => {
      lazyBackgroundObserver.observe(lazyBackground);
    });
  }
}

// Initialize lazy loading when the page loads
if (typeof window !== 'undefined') {
  window.lazyLoadBackgroundImages = lazyLoadBackgroundImages;
  
  if (document.readyState === 'complete') {
    lazyLoadBackgroundImages();
  } else {
    window.addEventListener('load', lazyLoadBackgroundImages);
    document.addEventListener('DOMContentLoaded', lazyLoadBackgroundImages);
  }
}
