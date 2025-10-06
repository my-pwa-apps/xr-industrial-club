# Quick Start Guide

Get up and running with XR Industrial Club in 5 minutes!

## Prerequisites

- Node.js 16+ and npm installed
- Modern browser (Chrome, Edge, or Firefox)
- (Optional) VR headset for WebXR testing

## Installation

```bash
# Navigate to project
cd xr-industrial-club

# Install dependencies
npm install
```

## Run Development Server

```bash
# Start Vite dev server
npm run dev
```

Open your browser to **http://localhost:3000**

## First Time Setup

1. **Wait for splash screen** - App initializes
2. **Click "Download Assets"** - Downloads Sponza model (~80MB)
3. **Watch progress** - Per-file download tracking
4. **Explore** - Use mouse or VR headset

## Controls

### Desktop
- **Mouse**: Look around (click canvas to lock pointer)
- **WASD**: Move
- **Space/Shift**: Up/Down
- **ESC**: Release pointer lock

### VR
- **VR Button**: Click "Enter VR"
- **Controllers**: Thumbstick to move

## Common Tasks

### Clear Cache
```
Click "Clear Cache" button in HUD
```

### Change Quality
```
Click "Quality" button to cycle: HIGH → MEDIUM → LOW
```

### View Controls
```
Click "Toggle Controls" button
```

### Build for Production
```bash
npm run build
# Output in dist/ folder
```

## Troubleshooting

**Assets won't download?**
- Check internet connection
- Check browser console for CORS errors

**VR not working?**
- Ensure HTTPS (or localhost)
- Check headset is connected
- Verify WebXR browser support

**Performance issues?**
- Switch to LOW quality mode
- Close other tabs
- Check GPU usage

## Next Steps

1. Edit `client/public/assets.json` to use different models
2. Create `lightplan.json` for custom lighting
3. Build and deploy to static hosting
4. Test on VR headset

## Need Help?

- Read full README.md
- Check PROJECT_SUMMARY.md for technical details
- Review code comments in source files

---

**Enjoy exploring!** 🚀
