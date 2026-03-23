import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export async function handleImageOptimization(req: http.IncomingMessage, res: http.ServerResponse, projectRoot: string) {
  let sharp: any;
  try {
    // @ts-ignore: sharp is an optional dependency
    sharp = await import('sharp').then(m => m.default || m);
  } catch (e) {
    // sharp is optional
  }
  try {
    const url = new URL(req.url!, `http://${req.headers.host || 'localhost'}`);
    const imageUrl = url.searchParams.get('url');
    const widthStr = url.searchParams.get('w');
    const qualityStr = url.searchParams.get('q');

    if (!imageUrl) {
      res.writeHead(400);
      res.end('Missing url parameter');
      return;
    }

    const width = widthStr ? parseInt(widthStr, 10) : undefined;
    const quality = qualityStr ? parseInt(qualityStr, 10) : 75;

    // Resolve image path (assuming it's a local public asset if it doesn't start with http)
    let imageBuffer: Buffer | null = null;

    if (imageUrl.startsWith('http')) {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${imageUrl}`);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      const publicDir = path.join(projectRoot, 'public');
      // Prevent directory traversal
      const resolvedPath = path.join(publicDir, imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl);
      if (!resolvedPath.startsWith(publicDir) || !fs.existsSync(resolvedPath)) {
        res.writeHead(404);
        res.end('Image not found');
        return;
      }
      imageBuffer = fs.readFileSync(resolvedPath);
    }

    if (!sharp) {
      // Fallback: just return the original image if sharp is not installed
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      res.end(imageBuffer);
      return;
    }

    // Process with sharp
    let processor = sharp(imageBuffer);
    
    if (width) {
      processor = processor.resize(width);
    }

    // Default to webp for optimized delivery
    processor = processor.webp({ quality });

    const optimizedBuffer = await processor.toBuffer();

    res.writeHead(200, {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable'
    });
    res.end(optimizedBuffer);
  } catch (error: any) {
    console.error('Image optimization error:', error);
    res.writeHead(500);
    res.end('Error processing image');
  }
}
