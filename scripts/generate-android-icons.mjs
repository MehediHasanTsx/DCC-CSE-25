import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.resolve(__dirname, '../public/icon-512.png');
const targetDirs = [
  path.resolve(__dirname, '../android-icons/res'),
  path.resolve(__dirname, '../android/app/src/main/res'),
];

const SIZES = [
  { folder: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { folder: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { folder: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { folder: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { folder: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

async function generate() {
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon not found at', sourceIcon);
    process.exit(1);
  }

  console.log('Generating Android launcher icons from:', sourceIcon);

  for (const baseTarget of targetDirs) {
    const isOptional = baseTarget.includes('android/app/src/main/res');
    if (isOptional && !fs.existsSync(path.dirname(baseTarget))) {
      // android/ directory does not exist yet; skip
      continue;
    }

    fs.mkdirSync(baseTarget, { recursive: true });

    for (const { folder, size, fgSize } of SIZES) {
      const dir = path.join(baseTarget, folder);
      fs.mkdirSync(dir, { recursive: true });

      // Standard square/squircle icon
      await sharp(sourceIcon)
        .resize(size, size, { fit: 'contain', background: { r: 9, g: 13, b: 22, alpha: 1 } })
        .png()
        .toFile(path.join(dir, 'ic_launcher.png'));

      // Round icon (with circle mask)
      const circleSvg = Buffer.from(
        `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="black"/></svg>`
      );
      await sharp(sourceIcon)
        .resize(size, size, { fit: 'cover' })
        .composite([{ input: circleSvg, blend: 'dest-in' }])
        .png()
        .toFile(path.join(dir, 'ic_launcher_round.png'));

      // Adaptive icon foreground (centered with padding)
      const innerSize = Math.round(fgSize * 0.72);
      const innerBuffer = await sharp(sourceIcon)
        .resize(innerSize, innerSize, { fit: 'contain' })
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: fgSize,
          height: fgSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          {
            input: innerBuffer,
            top: Math.round((fgSize - innerSize) / 2),
            left: Math.round((fgSize - innerSize) / 2),
          },
        ])
        .png()
        .toFile(path.join(dir, 'ic_launcher_foreground.png'));
    }

    console.log(`✅ Generated Android launcher icons in: ${baseTarget}`);
  }

  console.log('\nAll Android brand icons generated successfully!');
}

generate().catch(console.error);

