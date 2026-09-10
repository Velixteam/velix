import React, { ImgHTMLAttributes } from 'react';
export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    quality?: number;
    priority?: boolean;
    unoptimized?: boolean;
}
export declare const Image: React.ForwardRefExoticComponent<ImageProps & React.RefAttributes<HTMLImageElement>>;
//# sourceMappingURL=Image.d.ts.map