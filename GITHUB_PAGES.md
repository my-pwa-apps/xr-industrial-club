# GitHub Pages Deployment Guide

## Setup for GitHub Pages

1. **Enable GitHub Pages**: Go to your repository settings and enable GitHub Pages from the main branch.

2. **File Structure**: The files are now organized for GitHub Pages:
   ```
   /
   ├── index.html          (main page)
   ├── src/               (JavaScript modules)
   ├── assets.json        (assets configuration)
   ├── lightplan.example.json
   └── sw.js             (service worker)
   ```

3. **No Build Process Needed**: The app uses CDN imports for Three.js, so no npm/build process is required.

4. **Access Your Site**: Your site will be available at:
   `https://[your-username].github.io/[repository-name]/`

## Testing Locally Without npm

If you want to test locally without npm:

1. **Use Python's built-in server**:
   ```bash
   python -m http.server 8000
   ```
   Then visit: http://localhost:8000

2. **Use PHP's built-in server**:
   ```bash
   php -S localhost:8000
   ```

3. **Use Node.js http-server** (if you have Node.js):
   ```bash
   npx http-server
   ```

## Features Available

- ✅ WebXR VR support
- ✅ Asset downloading and caching
- ✅ Dynamic lighting system
- ✅ Desktop and VR controls
- ✅ Service Worker for offline capability
- ✅ External asset loading (Sponza environment)

## Controls

- **Desktop**: WASD to move, mouse to look around
- **VR**: Use VR controllers for movement and interaction