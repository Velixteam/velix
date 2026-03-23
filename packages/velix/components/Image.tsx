import React, { ImgHTMLAttributes, forwardRef, useState, useEffect } from 'react';

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  quality?: number;
  priority?: boolean;
  unoptimized?: boolean;
}

const defaultWidths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const defaultQuality = 75;

export const Image = forwardRef<HTMLImageElement, ImageProps>(({
  src,
  alt,
  width,
  height,
  quality = defaultQuality,
  priority = false,
  unoptimized = false,
  className,
  style,
  ...rest
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // If it's an external URL (http) or unoptimized is set, we skip the optimization router
  const isExternal = src.startsWith('http');
  const skipOptimization = unoptimized || (isExternal && !src.includes('our-domain'));

  const generateSrcSet = () => {
    if (skipOptimization) return undefined;
    return defaultWidths
      .map(w => `/__velix/image?url=${encodeURIComponent(src)}&w=${w}&q=${quality} ${w}w`)
      .join(', ');
  };

  const optimizedSrc = skipOptimization
    ? src
    : `/__velix/image?url=${encodeURIComponent(src)}&w=${width || 1080}&q=${quality}`;

  return (
    <img
      ref={ref}
      src={optimizedSrc}
      srcSet={generateSrcSet()}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className={className}
      style={{
        color: 'transparent',
        ...style
      }}
      onLoad={(e) => {
        setIsLoaded(true);
        if (rest.onLoad) rest.onLoad(e);
      }}
      {...rest}
    />
  );
});

Image.displayName = 'Image';
