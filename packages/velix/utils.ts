/**
 * Velix v5 Utility Functions
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Generates a unique hash for cache busting
 */
export function generateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

/**
 * Escapes HTML special characters
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  };
  return String(str).replace(/[&<>"']/g, char => htmlEntities[char]);
}

/**
 * Recursively finds all files matching a pattern
 */
export function findFiles(dir: string, pattern: RegExp, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) findFiles(fullPath, pattern, files);
    else if (pattern.test(entry.name)) files.push(fullPath);
  }
  return files;
}

/**
 * Ensures a directory exists
 */
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Cleans a directory
 */
export function cleanDir(dir: string): void {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Copies a directory recursively
 */
export function copyDir(src: string, dest: string): void {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

/**
 * Debounce function for file watching
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats milliseconds to human-readable string
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Creates a deferred promise
 */
export function createDeferred() {
  let resolve: any, reject: any;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a file is a server component (has 'use server' directive)
 */
export function isServerComponent(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const firstLine = content.split('\n')[0].trim();
    return firstLine === "'use server'" || firstLine === '"use server"';
  } catch { return false; }
}

/**
 * Check if a file is a client component (has 'use client' directive)
 */
export function isClientComponent(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const firstLine = content.split('\n')[0].trim();
    return firstLine === "'use client'" || firstLine === '"use client"';
  } catch { return false; }
}

/**
 * Check if a component is an island (has 'use island' directive)
 */
export function isIsland(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const firstLine = content.split('\n')[0].trim();
    return firstLine === "'use island'" || firstLine === '"use island"';
  } catch { return false; }
}
