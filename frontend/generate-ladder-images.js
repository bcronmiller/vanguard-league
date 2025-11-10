#!/usr/bin/env node

/**
 * Generate static images of ladder rankings for social media/displays
 *
 * Usage:
 *   node scripts/generate-ladder-images.js
 *
 * Output:
 *   Creates PNG images in ./public/ladder-images/
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'public/ladder-images');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const PAGES = [
  { name: 'p4p', url: '/ladder/p4p', title: 'Pound-for-Pound' },
  { name: 'lightweight', url: '/ladder/lightweight', title: 'Lightweight' },
  { name: 'middleweight', url: '/ladder/middleweight', title: 'Middleweight' },
  { name: 'heavyweight', url: '/ladder/heavyweight', title: 'Heavyweight' }
];

async function generateImages() {
  console.log('🎨 Generating ladder images...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const ladder of PAGES) {
    console.log(`📸 Capturing ${ladder.title}...`);

    // Set viewport for social media (1200x630 is ideal for FB/Twitter)
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Navigate to the page
    await page.goto(`${BASE_URL}${ladder.url}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for content to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Take full page screenshot
    const fullPagePath = path.join(OUTPUT_DIR, `${ladder.name}-full.png`);
    await page.screenshot({
      path: fullPagePath,
      fullPage: true
    });
    console.log(`  ✅ Full page: ${fullPagePath}`);

    // Take social media optimized screenshot (cropped to top content)
    const socialPath = path.join(OUTPUT_DIR, `${ladder.name}-social.png`);
    await page.screenshot({
      path: socialPath,
      clip: { x: 0, y: 0, width: 1200, height: 630 }
    });
    console.log(`  ✅ Social media: ${socialPath}`);

    // Take Instagram square screenshot
    const instagramPath = path.join(OUTPUT_DIR, `${ladder.name}-instagram.png`);
    await page.screenshot({
      path: instagramPath,
      clip: { x: 0, y: 0, width: 1080, height: 1080 }
    });
    console.log(`  ✅ Instagram: ${instagramPath}\n`);
  }

  await browser.close();

  console.log('\n✨ All images generated successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log('\nGenerated files:');
  console.log('  *-full.png       - Complete page screenshot');
  console.log('  *-social.png     - 1200x630 for Facebook/Twitter');
  console.log('  *-instagram.png  - 1080x1080 for Instagram');
}

// Run the script
generateImages().catch(err => {
  console.error('❌ Error generating images:', err);
  process.exit(1);
});
