# Ladder Rankings Image Generator

Automatically generates professional static images of ladder rankings for social media sharing and displays.

## Generated Images

**12 total images** (3 versions × 4 ladders):

### Ladders
- Pound-for-Pound (all weight classes)
- Lightweight (<170 lbs)
- Middleweight (170-185 lbs)
- Heavyweight (>185 lbs)

### Image Formats

1. **Full Page** (`*-full.png`)
   - Complete ladder screenshot
   - High resolution (2400px wide)
   - Best for: Displays, printouts, detailed sharing

2. **Social Media** (`*-social.png`)
   - 1200×630 pixels
   - Optimized for Facebook/Twitter link previews
   - Best for: Social media posts, website thumbnails

3. **Instagram** (`*-instagram.png`)
   - 1080×1080 pixels (square)
   - Best for: Instagram posts, profile images

## Usage

### Generate Images

Make sure the frontend dev server is running on `localhost:3000`, then:

```bash
cd /home/bc/vanguard-league-platform/frontend
node generate-ladder-images.js
```

**Output:** Images saved to `public/ladder-images/`

### Access Images

Images are automatically accessible via the Next.js public folder:

```
http://localhost:3000/ladder-images/p4p-full.png
http://localhost:3000/ladder-images/p4p-social.png
http://localhost:3000/ladder-images/p4p-instagram.png

http://localhost:3000/ladder-images/lightweight-full.png
http://localhost:3000/ladder-images/lightweight-social.png
http://localhost:3000/ladder-images/lightweight-instagram.png

http://localhost:3000/ladder-images/middleweight-full.png
http://localhost:3000/ladder-images/middleweight-social.png
http://localhost:3000/ladder-images/middleweight-instagram.png

http://localhost:3000/ladder-images/heavyweight-full.png
http://localhost:3000/ladder-images/heavyweight-social.png
http://localhost:3000/ladder-images/heavyweight-instagram.png
```

Or access directly from the file system:
```bash
cd public/ladder-images/
open p4p-full.png
```

## When to Regenerate

Run the script after:
- Completing a new event
- Updating rankings via the "UPDATE RANKINGS" button
- Making design changes to ladder pages

## Sharing Tips

### Facebook/Twitter
Use `*-social.png` files (1200×630). These are optimized for link preview cards.

### Instagram
Use `*-instagram.png` files (1080×1080 square). Works great for feed posts.

### Gym Displays
Use `*-full.png` files. These capture the entire ladder with all fighters.

### Website Thumbnails
Use `*-social.png` files for blog posts or announcements.

## Customization

To change image dimensions, edit `generate-ladder-images.js`:

```javascript
// Social media size
await page.setViewport({ width: 1200, height: 630 });

// Instagram size
clip: { x: 0, y: 0, width: 1080, height: 1080 }
```

## Technical Details

- **Tool:** Puppeteer (headless Chrome)
- **Resolution:** 2x device scale factor (Retina quality)
- **Format:** PNG with transparency support
- **File sizes:** ~400-700KB per image

## Troubleshooting

**Error: "Cannot find module 'puppeteer'"**
```bash
cd frontend
npm install --save-dev puppeteer
```

**Error: "Connection refused to localhost:3000"**
- Make sure Next.js dev server is running
- Check if it's on a different port

**Images look cut off**
- Adjust viewport height in the script
- Or use `-full.png` versions which capture entire page

---

*Generated images automatically include VanGuard Gym branding, logo, and professional styling from the live ladder pages.*
