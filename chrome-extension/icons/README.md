# Chrome Extension Icons

## Quick Fix (Current)

Icons are currently **optional** in the manifest. The extension will use Chrome's default extension icon.

## To Add Custom Icons (Optional)

### Option 1: Use Online Tool
1. Go to https://icon.kitchen/ or https://www.favicon-generator.org/
2. Upload the `icon.svg` file (or create your own design)
3. Generate PNG icons in sizes: 16x16, 48x48, 128x128
4. Download and save them as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### Option 2: Use ImageMagick (Command Line)
```bash
# Install ImageMagick first
# On Windows: choco install imagemagick
# On Mac: brew install imagemagick
# On Linux: apt-get install imagemagick

# Generate icons
magick convert icon.svg -resize 16x16 icon16.png
magick convert icon.svg -resize 48x48 icon48.png
magick convert icon.svg -resize 128x128 icon128.png
```

### Option 3: Manual with Design Tool
Use any graphics editor (Photoshop, GIMP, Figma, etc.):
- Create 3 PNG files: 16x16, 48x48, 128x128 pixels
- Simple design ideas:
  - Document with AI sparkle
  - Resume page icon
  - Letters "RA" (Resume AI)

## Re-enable Icons in Manifest

After creating the icons, update `manifest.json`:

```json
"action": {
  "default_popup": "popup.html",
  "default_title": "Resume AI Extractor",
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
},
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

Then update the build script in `package.json`:

```json
"copy": "cp manifest.json dist/ && cp popup.html dist/ && cp options.html dist/ && cp -r icons dist/"
```

And rebuild:
```bash
npm run build
```

## Current Status

✅ Extension works without custom icons  
⚠️ Uses default Chrome extension icon  
📝 Custom icons can be added later when needed
