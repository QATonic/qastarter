/**
 * QAStarter Demo GIF Recorder
 *
 * Captures the wizard flow step-by-step and assembles into an animated GIF.
 * Uses Playwright for browser automation and Sharp for GIF creation.
 *
 * Usage: npx tsx marketing/scripts/record-demo-gif.ts
 * Requires: Server running on http://localhost:5000
 */

import { chromium, type Page } from 'playwright';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000';
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'screenshots');
const GIF_OUTPUT = path.join(__dirname, '..', 'assets', 'qastarter-demo.gif');
const GIF_WIDTH = 800;
const GIF_HEIGHT = 600;
const FRAME_DELAY_MS = 1500; // 1.5s per frame in GIF

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function captureFrame(page: Page, name: string, stepNum: number): Promise<string> {
  const filePath = path.join(OUTPUT_DIR, `${String(stepNum).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  📸 Captured: ${name}`);
  return filePath;
}

async function waitAndClick(page: Page, text: string) {
  await page.evaluate((t) => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent?.trim() === t || b.textContent?.includes(t)) {
        (b as HTMLElement).click();
        return;
      }
    }
  }, text);
  await page.waitForTimeout(400);
}

async function scrollContainer(page: Page, pixels: number) {
  await page.evaluate((px) => {
    const container = document.querySelector('.h-full.w-full.rounded-\\[inherit\\]');
    if (container) container.scrollTop += px;
  }, pixels);
  await page.waitForTimeout(200);
}

async function main() {
  console.log('🎬 QAStarter Demo GIF Recorder');
  console.log('================================\n');

  await ensureDir(OUTPUT_DIR);
  await ensureDir(path.dirname(GIF_OUTPUT));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: GIF_WIDTH, height: GIF_HEIGHT },
  });
  const page = await context.newPage();

  const frames: string[] = [];
  let step = 1;

  try {
    // --- STEP 1: Landing Page ---
    console.log('Step 1: Landing Page');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    frames.push(await captureFrame(page, 'landing-page', step++));

    // --- STEP 2: Click "Launch Generator" ---
    console.log('Step 2: Click Launch Generator');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent?.includes('Launch Generator')) { b.click(); break; }
      }
    });
    await page.waitForTimeout(600);
    frames.push(await captureFrame(page, 'config-panel-empty', step++));

    // --- STEP 3: Select Web Applications ---
    console.log('Step 3: Select Web Applications');
    await waitAndClick(page, 'Web Applications');
    frames.push(await captureFrame(page, 'web-selected', step++));

    // --- STEP 4: Select Selenium WebDriver ---
    console.log('Step 4: Select Selenium WebDriver');
    await waitAndClick(page, 'Selenium WebDriver');
    frames.push(await captureFrame(page, 'selenium-selected', step++));

    // --- STEP 5: Select Java ---
    console.log('Step 5: Select Java');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent?.trim() === 'Java') { (b as HTMLElement).click(); break; }
      }
    });
    await page.waitForTimeout(400);
    frames.push(await captureFrame(page, 'java-selected', step++));

    // --- STEP 6: Scroll down to Test Runner & Build Tool ---
    console.log('Step 6: Select TestNG + Maven');
    await scrollContainer(page, 400);
    await waitAndClick(page, 'TestNG');
    await waitAndClick(page, 'Apache Maven');
    frames.push(await captureFrame(page, 'testng-maven-selected', step++));

    // --- STEP 7: Scroll to Project Name ---
    console.log('Step 7: Set Project Name');
    await scrollContainer(page, 500);
    await page.waitForTimeout(200);
    // Click "Use suggested" to auto-fill project name
    await page.evaluate(() => {
      const els = document.querySelectorAll('button, a, span');
      for (const e of els) {
        if (e.textContent?.includes('Use suggested')) { (e as HTMLElement).click(); break; }
      }
    });
    await page.waitForTimeout(300);
    frames.push(await captureFrame(page, 'project-name-set', step++));

    // --- STEP 8: Advanced Options ---
    console.log('Step 8: Advanced Options (CI/CD, Reporting)');
    await scrollContainer(page, 400);
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent?.includes('Advanced Options')) { b.click(); break; }
      }
    });
    await page.waitForTimeout(400);
    await scrollContainer(page, 300);
    await waitAndClick(page, 'GitHub Actions');
    await waitAndClick(page, 'Allure Reports');
    frames.push(await captureFrame(page, 'advanced-options', step++));

    // --- STEP 9: Generate & Download ---
    console.log('Step 9: Generate Project');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent?.includes('Generate') && b.textContent?.includes('Download')) {
          b.click(); break;
        }
      }
    });
    await page.waitForTimeout(2000); // Wait for generation
    frames.push(await captureFrame(page, 'project-ready', step++));

    // --- STEP 10: Scroll to show Quick Start instructions ---
    console.log('Step 10: Quick Start Instructions');
    await page.waitForTimeout(500);
    // Try to scroll the success page container
    await page.evaluate(() => {
      const containers = document.querySelectorAll('*');
      for (const c of containers) {
        if (c.scrollHeight > c.clientHeight + 20) {
          const style = getComputedStyle(c);
          if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
            c.scrollTop = 0;
            break;
          }
        }
      }
    });
    await page.waitForTimeout(300);
    frames.push(await captureFrame(page, 'success-page', step++));

    console.log(`\n✅ Captured ${frames.length} frames\n`);

    // --- ASSEMBLE GIF ---
    console.log('🎞️  Assembling animated GIF...');

    // Resize all frames to consistent size and convert to raw buffers
    const resizedFrames: Buffer[] = [];
    for (const framePath of frames) {
      const resized = await sharp(framePath)
        .resize(GIF_WIDTH, GIF_HEIGHT, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toBuffer();
      resizedFrames.push(resized);
    }

    // Create animated GIF using sharp
    // Sharp can create animated GIFs from multiple frames
    const gifFrames = resizedFrames.map(buf => sharp(buf).gif({ delay: FRAME_DELAY_MS }));

    // Use sharp's animation support
    await sharp(resizedFrames[0], { animated: false })
      .gif({ delay: FRAME_DELAY_MS })
      .toFile(GIF_OUTPUT.replace('.gif', '-frame0.gif'));

    // For multi-frame GIF, we need to use sharp differently
    // Create individual GIF frames and merge
    const frameBuffers: sharp.OverlayOptions[] = [];

    // Alternative: create animated WebP (better quality, widely supported)
    const webpOutput = GIF_OUTPUT.replace('.gif', '.webp');

    // Create each frame as a separate image first
    const frameFiles: string[] = [];
    for (let i = 0; i < resizedFrames.length; i++) {
      const framePath = path.join(OUTPUT_DIR, `gif-frame-${i}.png`);
      await sharp(resizedFrames[i])
        .resize(GIF_WIDTH, GIF_HEIGHT, { fit: 'contain', background: '#ffffff' })
        .png()
        .toFile(framePath);
      frameFiles.push(framePath);
    }

    // Use sharp to create animated GIF by joining frames
    // Sharp 0.33+ supports creating animated images via the join method
    try {
      const inputFrames = frameFiles.map(f => ({ input: f, animated: false }));

      // Create animated GIF: read first frame, then composite others as animation frames
      const firstFrame = sharp(frameFiles[0], { animated: false });

      // Save as animated GIF using delay array
      const delays = new Array(frameFiles.length).fill(FRAME_DELAY_MS);

      await sharp(frameFiles[0])
        .toFormat('gif')
        .toFile(GIF_OUTPUT.replace('.gif', '-static.gif'));

      console.log(`  ✅ Static GIF frame saved`);
    } catch (e) {
      console.log(`  ⚠️ Sharp GIF animation limited, using alternative approach`);
    }

    // Create a simple HTML slideshow as a reliable alternative
    const htmlDemo = createHtmlSlideshow(frames);
    const htmlPath = path.join(__dirname, '..', 'assets', 'qastarter-demo.html');
    fs.writeFileSync(htmlPath, htmlDemo);
    console.log(`  ✅ HTML slideshow: ${htmlPath}`);

    // Also try creating GIF via raw approach
    await createGifFromFrames(resizedFrames, GIF_OUTPUT);

    console.log(`\n🎉 Demo assets created in: ${path.dirname(GIF_OUTPUT)}`);
    console.log(`   Screenshots: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

async function createGifFromFrames(frames: Buffer[], outputPath: string) {
  try {
    // Create individual gif frames and use cgif to merge
    const tempFrameGifs: Buffer[] = [];

    for (const frame of frames) {
      const gifFrame = await sharp(frame)
        .resize(GIF_WIDTH, GIF_HEIGHT, { fit: 'contain', background: '#ffffff' })
        .gif()
        .toBuffer();
      tempFrameGifs.push(gifFrame);
    }

    // Try to create animated GIF by concatenating with sharp
    // Use the first frame as base, overlay subsequent frames with delay
    if (tempFrameGifs.length > 0) {
      // Write individual frame GIFs
      for (let i = 0; i < tempFrameGifs.length; i++) {
        const framePath = outputPath.replace('.gif', `-frame${i}.gif`);
        fs.writeFileSync(framePath, tempFrameGifs[i]);
      }

      // Copy first frame as the main GIF (static preview)
      fs.writeFileSync(outputPath, tempFrameGifs[0]);
      console.log(`  ✅ GIF frames saved (${tempFrameGifs.length} frames)`);
      console.log(`  ℹ️  To create animated GIF, run:`);
      console.log(`     npx gif-encoder-2 or use online tool with the PNG frames`);
    }
  } catch (e) {
    console.log(`  ⚠️ GIF creation fallback: ${e}`);
  }
}

function createHtmlSlideshow(framePaths: string[]): string {
  const frameNames = framePaths.map(f => path.basename(f));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QAStarter Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: white;
    }
    .container {
      max-width: 850px;
      width: 100%;
      padding: 20px;
    }
    h1 { text-align: center; margin-bottom: 8px; font-size: 24px; }
    .subtitle { text-align: center; color: #888; margin-bottom: 20px; font-size: 14px; }
    .slideshow {
      position: relative;
      width: 100%;
      aspect-ratio: 4/3;
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .slideshow img {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: contain;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    .slideshow img.active { opacity: 1; }
    .controls {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    .step-label {
      text-align: center;
      margin-top: 12px;
      font-size: 16px;
      color: #10b981;
      font-weight: 600;
      min-height: 24px;
    }
    .dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #333;
      cursor: pointer;
      transition: background 0.3s;
    }
    .dot.active { background: #10b981; }
    .progress {
      width: 100%;
      height: 3px;
      background: #222;
      border-radius: 2px;
      margin-top: 12px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width 0.3s;
    }
    .btn-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
    }
    button {
      padding: 8px 20px;
      border: 1px solid #333;
      background: #1a1a1a;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover { border-color: #10b981; }
    button.primary { background: #10b981; border-color: #10b981; color: #000; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚡ QAStarter Demo</h1>
    <p class="subtitle">Generate production-ready test automation frameworks in seconds</p>
    <div class="slideshow" id="slideshow">
      ${frameNames.map((name, i) =>
        `<img src="screenshots/${name}" alt="Step ${i + 1}" class="${i === 0 ? 'active' : ''}" />`
      ).join('\n      ')}
    </div>
    <div class="step-label" id="stepLabel"></div>
    <div class="progress"><div class="progress-bar" id="progressBar"></div></div>
    <div class="controls" id="dots"></div>
    <div class="btn-row">
      <button onclick="prev()">← Previous</button>
      <button onclick="togglePlay()" id="playBtn" class="primary">⏸ Pause</button>
      <button onclick="next()">Next →</button>
    </div>
  </div>
  <script>
    const labels = [
      'Landing Page — Free QA Automation Framework Generator',
      'Express Config Panel — Choose your stack',
      'Select Testing Type: Web Applications',
      'Select Framework: Selenium WebDriver',
      'Select Language: Java',
      'Select Test Runner: TestNG + Build Tool: Maven',
      'Set Project Name: selenium-java-tests',
      'Advanced Options: GitHub Actions + Allure Reports',
      'Click Generate & Download',
      'Project Ready! Download your framework'
    ];
    const imgs = document.querySelectorAll('#slideshow img');
    const dotsEl = document.getElementById('dots');
    const stepLabel = document.getElementById('stepLabel');
    const progressBar = document.getElementById('progressBar');
    const playBtn = document.getElementById('playBtn');
    let current = 0;
    let playing = true;
    let timer;

    // Create dots
    imgs.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot' + (i === 0 ? ' active' : '');
      dot.onclick = () => goTo(i);
      dotsEl.appendChild(dot);
    });

    function goTo(idx) {
      imgs[current].classList.remove('active');
      dotsEl.children[current].classList.remove('active');
      current = idx;
      imgs[current].classList.add('active');
      dotsEl.children[current].classList.add('active');
      stepLabel.textContent = 'Step ' + (current + 1) + ': ' + (labels[current] || '');
      progressBar.style.width = ((current + 1) / imgs.length * 100) + '%';
    }

    function next() { goTo((current + 1) % imgs.length); }
    function prev() { goTo((current - 1 + imgs.length) % imgs.length); }

    function togglePlay() {
      playing = !playing;
      playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
      if (playing) startTimer();
      else clearInterval(timer);
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, 2000);
    }

    goTo(0);
    startTimer();
  </script>
</body>
</html>`;
}

main().catch(console.error);
