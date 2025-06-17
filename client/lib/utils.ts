import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function getApiBaseUrl(): string {
  // Always use relative URLs - Next.js rewrites will handle routing to backend
  return '/api/v1';
}

export function getSocketUrl(): string {
  // For Socket.io in development, connect directly to backend
  // In production, use the same origin - Next.js rewrites will handle routing
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:7000';
  }
  
  // If you have a separate backend server in production, uncomment and update:
  // return process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin;
  
  return window.location.origin;
}

export function compareArrays<T>(arr1: T[], arr2: T[]): boolean {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    return false;
  }
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
