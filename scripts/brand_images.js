const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function brandImages() {
  const productsDir = path.join(__dirname, '../public/products');
  const backupDir = path.join(__dirname, '../public/products_original');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Found ${files.length} images to brand with LTL logo.`);

  let count = 0;
  for (const file of files) {
    const srcPath = path.join(productsDir, file);
    const backupPath = path.join(backupDir, file);

    // Save backup if not already saved
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(srcPath, backupPath);
    }

    const image = sharp(backupPath);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 800;

    // Create stylish LTL luxury watermark badge in top-right or bottom-right
    const badgeW = Math.max(140, Math.round(width * 0.22));
    const badgeH = Math.max(44, Math.round(badgeW * 0.32));
    const margin = Math.max(18, Math.round(width * 0.035));
    const posX = width - badgeW - margin;
    const posY = height - badgeH - margin;

    const fontSizeLtl = Math.round(badgeH * 0.48);
    const fontSizeSub = Math.round(badgeH * 0.22);

    const svgWatermark = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ltlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#140b14" stop-opacity="0.92"/>
            <stop offset="100%" stop-color="#2a081d" stop-opacity="0.95"/>
          </linearGradient>
        </defs>
        <g transform="translate(${posX}, ${posY})">
          <!-- Outer Badge -->
          <rect x="0" y="0" width="${badgeW}" height="${badgeH}" rx="${Math.round(badgeH * 0.24)}" 
                fill="url(#ltlGrad)" stroke="#D6B36A" stroke-width="1.8" />
          
          <!-- LTL Bold Monogram -->
          <text x="${Math.round(badgeW * 0.12)}" y="${Math.round(badgeH * 0.66)}" 
                font-family="Arial, Helvetica, sans-serif" font-size="${fontSizeLtl}" font-weight="900" 
                fill="#D6B36A" letter-spacing="1.5">LTL</text>
          
          <!-- Divider -->
          <line x1="${Math.round(badgeW * 0.48)}" y1="${Math.round(badgeH * 0.18)}" 
                x2="${Math.round(badgeW * 0.48)}" y2="${Math.round(badgeH * 0.82)}" 
                stroke="rgba(214,179,106,0.4)" stroke-width="1" />
          
          <!-- Subtitle -->
          <text x="${Math.round(badgeW * 0.54)}" y="${Math.round(badgeH * 0.46)}" 
                font-family="Arial, Helvetica, sans-serif" font-size="${fontSizeSub}" font-weight="800" 
                fill="#ffffff" letter-spacing="1">LASH LOUNGE</text>
          <text x="${Math.round(badgeW * 0.54)}" y="${Math.round(badgeH * 0.76)}" 
                font-family="Arial, Helvetica, sans-serif" font-size="${fontSizeSub * 0.88}" font-weight="700" 
                fill="#C21875" letter-spacing="1">SIALKOT</text>
        </g>
      </svg>
    `;

    await sharp(backupPath)
      .composite([{
        input: Buffer.from(svgWatermark),
        top: 0,
        left: 0
      }])
      .jpeg({ quality: 92 })
      .toFile(srcPath);

    count++;
  }

  console.log(`Successfully stamped LTL logo on all ${count} images!`);
}

brandImages().catch(console.error);
