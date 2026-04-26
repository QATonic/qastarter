/**
 * Assemble captured screenshots into an animated GIF.
 * Uses gif-encoder-2 for reliable multi-frame GIF creation.
 *
 * Usage: npx tsx marketing/scripts/assemble-gif.ts
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const GIFEncoder = require('gif-encoder-2');

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const SCREENSHOTS_DIR = path.join(__dirname2, '..', 'assets', 'screenshots');
const ASSETS_DIR = path.join(__dirname2, '..', 'assets');
const WIDTH = 800;
const HEIGHT = 600;
const FRAME_DELAY = 2000; // 2 seconds per normal frame

async function main() {
  console.log('🎞️  Assembling animated GIF from screenshots...\n');

  // Get ordered screenshot files
  const files = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => /^\d{2}-/.test(f) && f.endsWith('.png'))
    .sort();

  console.log(`Found ${files.length} frames:`);
  files.forEach(f => console.log(`  - ${f}`));

  // Prepare frame data with delays
  interface FrameEntry { file: string; delay: number; }
  const frameEntries: FrameEntry[] = [
    { file: files[0], delay: 2500 },    // Landing page - hold longer
    { file: files[1], delay: 1500 },    // Config panel empty
    { file: files[2], delay: 1500 },    // Web selected
    { file: files[3], delay: 1500 },    // Selenium selected
    { file: files[4], delay: 1500 },    // Java selected
    { file: files[5], delay: 2000 },    // TestNG + Maven
    { file: files[6], delay: 2000 },    // Project name set
    { file: files[7], delay: 2500 },    // Advanced options - show longer
    { file: files[8], delay: 3000 },    // Project Ready!
    { file: files[9], delay: 3000 },    // Success page - hold longest
  ];

  // Create GIF encoder
  const encoder = new GIFEncoder(WIDTH, HEIGHT, 'neuquant', true);
  const gifPath = path.join(ASSETS_DIR, 'qastarter-demo.gif');
  const writeStream = fs.createWriteStream(gifPath);

  encoder.createReadStream().pipe(writeStream);
  encoder.start();
  encoder.setRepeat(0);       // 0 = loop forever
  encoder.setQuality(10);     // image quality (lower = better but slower)
  encoder.setTransparent(0);

  console.log(`\nEncoding ${frameEntries.length} frames...`);

  for (let i = 0; i < frameEntries.length; i++) {
    const { file, delay } = frameEntries[i];
    const filePath = path.join(SCREENSHOTS_DIR, file);

    // Resize and get raw RGBA pixel data
    const rawBuffer = await sharp(filePath)
      .resize(WIDTH, HEIGHT, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .ensureAlpha()
      .raw()
      .toBuffer();

    encoder.setDelay(delay);
    encoder.addFrame(rawBuffer);
    console.log(`  ✅ Frame ${i + 1}/${frameEntries.length}: ${file} (${delay}ms)`);
  }

  encoder.finish();

  // Wait for write stream to finish
  await new Promise<void>((resolve) => writeStream.on('finish', resolve));

  const gifSize = fs.statSync(gifPath).size;
  console.log(`\n🎉 Animated GIF created: ${gifPath}`);
  console.log(`   Size: ${(gifSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Frames: ${frameEntries.length}`);
  console.log(`   Resolution: ${WIDTH}x${HEIGHT}`);
  console.log(`   Total duration: ${frameEntries.reduce((sum, f) => sum + f.delay, 0) / 1000}s`);

  // Also create a smaller version for social media (400x300)
  const SMALL_WIDTH = 400;
  const SMALL_HEIGHT = 300;
  const smallEncoder = new GIFEncoder(SMALL_WIDTH, SMALL_HEIGHT, 'neuquant', true);
  const smallGifPath = path.join(ASSETS_DIR, 'qastarter-demo-small.gif');
  const smallWriteStream = fs.createWriteStream(smallGifPath);

  smallEncoder.createReadStream().pipe(smallWriteStream);
  smallEncoder.start();
  smallEncoder.setRepeat(0);
  smallEncoder.setQuality(10);

  console.log('\nCreating small version (400x300) for social media...');

  for (let i = 0; i < frameEntries.length; i++) {
    const { file, delay } = frameEntries[i];
    const filePath = path.join(SCREENSHOTS_DIR, file);

    const rawBuffer = await sharp(filePath)
      .resize(SMALL_WIDTH, SMALL_HEIGHT, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .ensureAlpha()
      .raw()
      .toBuffer();

    smallEncoder.setDelay(delay);
    smallEncoder.addFrame(rawBuffer);
  }

  smallEncoder.finish();
  await new Promise<void>((resolve) => smallWriteStream.on('finish', resolve));

  const smallSize = fs.statSync(smallGifPath).size;
  console.log(`✅ Small GIF: ${smallGifPath} (${(smallSize / 1024 / 1024).toFixed(2)} MB)`);

  console.log('\n📁 All assets:');
  const assets = fs.readdirSync(ASSETS_DIR).filter(f => !fs.statSync(path.join(ASSETS_DIR, f)).isDirectory());
  assets.forEach(f => {
    const size = fs.statSync(path.join(ASSETS_DIR, f)).size;
    console.log(`   ${f} (${(size / 1024).toFixed(0)} KB)`);
  });
}

main().catch(console.error);
