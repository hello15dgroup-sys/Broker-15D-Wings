import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateFlightTime(lat1: number, lon1: number, lat2: number, lon2: number, speedKnots: number = 450) {
  // Speed in knots (nautical miles per hour)
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  const totalHours = distance / speedKnots;
  
  if (isNaN(totalHours) || distance === 0) return 'TBD';
  
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard.writeText unavailable or permission denied, using fallback', err);
  }

  // Fallback for sandboxed iframes or environments with clipboard restrictions
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (fallbackErr) {
    console.error('Fallback clipboard copy failed:', fallbackErr);
  }
  return false;
}

export function formatToLocalDate(isoString: string, includeTime: boolean = false) {
  if (!isoString) return '';
  const date = new Date(isoString);
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  const lang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US';
  return new Intl.DateTimeFormat(lang, options).format(date);
}
