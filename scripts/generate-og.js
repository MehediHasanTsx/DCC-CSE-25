/* eslint-disable */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const screenshotPath = 'C:/Users/User/.gemini/antigravity-ide/brain/679740bd-30b9-4559-a478-649f0f6c33db/.user_uploaded/media_1792673752133.png';
const outputPath = path.join(process.cwd(), 'public', 'og-image.png');

async function createOgImage() {
  const width = 1200;
  const height = 630;

  // Background SVG with gradient and header text
  const bgSvg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#070a12" />
          <stop offset="50%" stop-color="#0c1222" />
          <stop offset="100%" stop-color="#080c18" />
        </linearGradient>
        <radialGradient id="purpleGlow" cx="20%" cy="15%" r="45%">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.38" />
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="blueGlow" cx="80%" cy="85%" r="50%">
          <stop offset="0%" stop-color="#2563eb" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
      <rect width="${width}" height="${height}" fill="url(#purpleGlow)" />
      <rect width="${width}" height="${height}" fill="url(#blueGlow)" />

      <!-- Top Branding -->
      <g transform="translate(50, 36)">
        <!-- Logo Icon Box -->
        <rect x="0" y="0" width="46" height="46" rx="13" fill="#6366f1" />
        <path d="M23 12 L35 18 L23 24 L11 18 Z M15 22 L15 28 C15 31 23 35 23 35 C23 35 31 31 31 28 L31 22" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linejoin="round" />
        
        <!-- Titles -->
        <text x="60" y="24" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="#ffffff" letter-spacing="-0.5">DCC CSE 25</text>
        <text x="60" y="42" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">Dhaka City College • Student Academic Dashboard</text>
      </g>

      <!-- Pill Badge Right -->
      <g transform="translate(860, 42)">
        <rect x="0" y="0" width="290" height="34" rx="17" fill="#1e293b" stroke="#334155" stroke-width="1" />
        <circle cx="20" cy="17" r="4.5" fill="#10b981" />
        <text x="34" y="22" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="600" fill="#e2e8f0">Official Academic Suite 2026</text>
      </g>
    </svg>
  `);

  // Target dimension for the dashboard screenshot
  const targetShotWidth = 1100;
  const targetShotHeight = 506;

  // Mask for rounded corners on the screenshot
  const roundedCornersMask = Buffer.from(`
    <svg width="${targetShotWidth}" height="${targetShotHeight}">
      <rect x="0" y="0" width="${targetShotWidth}" height="${targetShotHeight}" rx="14" ry="14" fill="#fff"/>
    </svg>
  `);

  const resizedScreenshot = await sharp(screenshotPath)
    .resize(targetShotWidth, targetShotHeight, { fit: 'fill' })
    .composite([{ input: roundedCornersMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Outer border frame for the screenshot
  const frameSvg = Buffer.from(`
    <svg width="${targetShotWidth + 4}" height="${targetShotHeight + 4}">
      <rect x="1" y="1" width="${targetShotWidth + 2}" height="${targetShotHeight + 2}" rx="15" ry="15" fill="none" stroke="#334155" stroke-width="1.5" />
    </svg>
  `);

  // Composite everything
  await sharp(bgSvg)
    .composite([
      { input: frameSvg, left: 48, top: 100 },
      { input: resizedScreenshot, left: 50, top: 102 },
    ])
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log('Successfully generated public/og-image.png');
}

createOgImage().catch(console.error);
