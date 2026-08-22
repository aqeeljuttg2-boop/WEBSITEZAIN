/**
 * Robust Image Path Normalizer & Resolver
 * Handles uploaded images, relative paths, full URLs, data URLs, and catalog fallbacks.
 */

export function normalizeImageUrl(img: string | undefined | null): string {
  if (!img || typeof img !== 'string') {
    return '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg';
  }

  const trimmed = img.trim();
  if (!trimmed) {
    return '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg';
  }

  // Base64 data URLs or External HTTP(S) URLs
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Already absolute root path starting with /
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // If path starts with known folders without leading slash
  if (
    trimmed.startsWith('products/') || 
    trimmed.startsWith('catagori/') || 
    trimmed.startsWith('uploads/') || 
    trimmed.startsWith('images/')
  ) {
    return `/${trimmed}`;
  }

  // If it's a category seed filename
  if (trimmed.startsWith('WhatsApp Image')) {
    return `/catagori/${trimmed}`;
  }

  // Default uploaded product image filename
  return `/products/${trimmed}`;
}

/**
 * Extracts and returns all valid normalized image URLs for a product
 */
export function getAllProductImages(product: { productCode?: string; images?: string; id?: string } | null | undefined): string[] {
  if (!product) {
    return ['/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg'];
  }

  if (product.images && product.images.trim()) {
    let raw = product.images.trim();
    let list: string[] = [];

    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          list = parsed.filter(Boolean);
        }
      } catch (_) {
        list = raw.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else {
      list = raw.split(',').map(s => s.trim()).filter(Boolean);
    }

    const validList = list.filter(item => item && item.trim().length > 0).map(normalizeImageUrl);
    if (validList.length > 0) {
      return validList;
    }
  }

  return [getProductImage(product)];
}

/**
 * Resolves a product's primary image to a valid public URL
 */
export function getProductImage(product: { productCode?: string; images?: string; id?: string } | null | undefined): string {
  if (!product) {
    return '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg';
  }

  if (product.images && product.images.trim()) {
    let raw = product.images.trim();
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
          return normalizeImageUrl(parsed[0]);
        }
      } catch (_) {}
    }
    
    const list = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length > 0 && list[0]) {
      return normalizeImageUrl(list[0]);
    }
  }

  const code = product.productCode?.toLowerCase() || '';
  
  if (code.startsWith('mic1') || code.startsWith('shear')) {
    const files = [
      'WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.13 AM.jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.21 AM.jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.21 AM (1).jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.22 AM.jpeg'
    ];
    const hash = getDeterministicHash(product.id || code, files.length);
    return `/catagori/${files[hash]}`;
  }
  
  if (code.startsWith('mic2') || code.startsWith('nail')) {
    const files = [
      'WhatsApp Image 2026-08-18 at 12.28.16 AM.jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.18 AM.jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.19 AM.jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.19 AM (1).jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.20 AM.jpeg'
    ];
    const hash = getDeterministicHash(product.id || code, files.length);
    return `/catagori/${files[hash]}`;
  }

  if (code.startsWith('mic3') || code.startsWith('shav')) {
    const files = [
      'WhatsApp Image 2026-08-18 at 12.28.12 AM.jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.12 AM (1).jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.14 AM.jpeg',
      'WhatsApp Image 2026-08-18 at 12.28.15 AM.jpeg'
    ];
    const hash = getDeterministicHash(product.id || code, files.length);
    return `/catagori/${files[hash]}`;
  }

  // Default: Eyelash Tweezers
  const tweezersFiles = [
    'WhatsApp Image 2026-08-18 at 12.28.05 AM.jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.06 AM.jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.07 AM.jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.07 AM (1).jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.09 AM.jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.09 AM (1).jpeg',
    'WhatsApp Image 2026-08-18 at 12.28.10 AM.jpeg'
  ];
  const hash = getDeterministicHash(product.id || code, tweezersFiles.length);
  return `/catagori/${tweezersFiles[hash]}`;
}

function getDeterministicHash(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % mod;
}
