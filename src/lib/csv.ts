/**
 * Robust CSV parser that handles quoted fields (with commas/newlines inside)
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine.trim());
      currentLine = '';
    } else if (char === '\r') {
      // ignore carriage return
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }

  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const results: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      // Clean header and normalize
      const key = header.replace(/^"|"$/g, '').trim();
      let val = values[index] !== undefined ? values[index] : '';
      // Strip outer quotes if any
      val = val.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      obj[key] = val;
    });
    results.push(obj);
  }
  
  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentVal += char; // Keep quotes for clean strip later
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal.trim());
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal.trim());
  return result;
}

/**
 * Generate CSV string from product records
 */
export function generateCSV(products: any[]): string {
  const headers = [
    'Product Name',
    'Product Code',
    'SKU',
    'Category',
    'Subcategory',
    'Description',
    'Material',
    'Size',
    'Price',
    'MOQ',
    'Stock',
    'Image URLs',
    'Tags'
  ];

  const rows = products.map(p => {
    const categoryName = p.category?.parentId ? (p.category.parent?.name || '') : (p.category?.name || '');
    const subcategoryName = p.category?.parentId ? (p.category.name || '') : '';

    return [
      p.name || '',
      p.productCode || '',
      p.sku || '',
      categoryName,
      subcategoryName,
      p.description || '',
      p.material || '',
      p.size || '',
      (p.singlePrice || 0).toString(),
      (p.moq || 1).toString(),
      (p.stock || 0).toString(),
      p.images || '',
      p.seoKeywords || ''
    ].map(val => {
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      let textVal = val.toString();
      const escaped = textVal.replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
        return `"${escaped}"`;
      }
      return escaped;
    });
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}
