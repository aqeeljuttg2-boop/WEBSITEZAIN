/**
 * Resolves a product image path to a valid public URL
 */
export function getProductImage(product: { productCode?: string; images?: string; id?: string }): string {
  if (product.images && product.images.trim()) {
    let raw = product.images.trim();
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0]) {
          return parsed[0];
        }
      } catch (_) {}
    }
    
    const list = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (list[0]) {
      return list[0];
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
