# XR Industrial Club

A production-ready WebXR experience with asset downloading, caching, and offline support. Features dynamic lighting and works in both VR and desktop modes.

## Features

- **WebXR Support**: Full VR support for Meta Quest and other headsets
- **Desktop Mode**: Mouse + keyboard controls for non-VR exploration
- **Asset Downloading**: Download large 3D models on-demand with progress tracking
- **Offline Support**: Service Worker caching for offline use
- **Dynamic Lighting**: Lightplan system with moving heads, strobes, and lasers
- **Quality Settings**: High/Medium/Low quality modes
- **External Assets**: Loads Sponza GLB model from GitHub

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### First Run

1. Open the app in your browser (http://localhost:3000)
2. Wait for the splash screen to load
3. Click **"Download Assets"** button to download the Sponza environment (~80MB)
4. Progress will be shown with per-file tracking
5. Once downloaded, assets are cached for offline use

### Using the App

#### Desktop Mode

- **Mouse**: Look around (click canvas to lock pointer)
- **WASD**: Move forward/back/left/right
- **Space**: Move up
- **Shift**: Move down
- **ESC**: Release pointer lock
- **OrbitControls**: Enabled when pointer is not locked

#### VR Mode

- **VR Button**: Click "Enter VR" to start VR session
- **Controllers**: Thumbstick for movement
- **Trigger**: Interact with objects

#### Controls

- **Download Assets**: Download and cache all external assets
- **Clear Cache**: Remove all cached assets (requires re-download)
- **Toggle Controls**: Show/hide control instructions
- **Quality**: Cycle between High/Medium/Low quality modes
- **Enter VR**: Start VR session (if headset is connected)

### Asset Configuration

Edit `client/public/assets.json` to customize assets:

```json
{
  "environmentUrl": "https://github.com/.../Sponza-KTX.glb",
  "lightplanUrl": "/lightplan.json",
  "additional": []
}
```

#### Using Draco Compression

To use the Draco-compressed variant (smaller file size):

```bash
# Copy Draco config
cp client/public/assets.draco.json client/public/assets.json
```

### Lightplan Configuration

Create a `lightplan.json` file to configure dynamic lighting:

```json
{
  "bpm": 128,
  "fixtures": [
    {
      "type": "movingHead",
      "position": [0, 5, 0],
      "target": [0, 0, 5],
      "color": "#0088ff",
      "intensity": 2.0,
      "beamAngle": 30
    },
    {
      "type": "strobe",
      "position": [5, 3, 0],
      "color": "#ffffff",
      "intensity": 5.0
    },
    {
      "type": "laser",
      "position": [-5, 3, 0],
      "target": [5, 1, 10],
      "color": "#ff0000",
      "intensity": 1.5
    }
  ]
}
```

**Fixture Types**:
- `movingHead`: Animated spotlight with pan/tilt
- `strobe`: Pulsing point light synced to BPM
- `laser`: Beam effect with sweep animation

## Project Structure

```
xr-industrial-club/
├── client/
│   ├── public/
│   │   ├── sw.js                    # Service Worker
│   │   ├── assets.json              # Asset configuration
│   │   ├── assets.draco.json        # Draco variant config
│   │   ├── lightplan.example.json   # Example lightplan
│   │   └── client-demo/
│   │       └── fallback-hall.glb    # Fallback environment
│   ├── src/
│   │   ├── main.js                  # Entry point
│   │   ├── App.js                   # Main application
│   │   ├── Cache.js                 # Service Worker & IndexedDB
│   │   ├── SceneLoader.js           # GLTF/KTX2/Draco loading
│   │   ├── Controls.js              # VR & desktop controls
│   │   ├── Lights.js                # Dynamic lighting system
│   │   └── UI.js                    # UI management
│   └── index.html                   # HTML entry point
├── package.json
├── vite.config.js
└── README.md
```

## Technical Details

### Asset Loading

- **GLTFLoader**: Load GLB/GLTF files
- **KTX2Loader**: Compressed textures (Basis Universal)
- **DRACOLoader**: Compressed geometry
- **Progress Tracking**: ReadableStream monitoring for accurate progress

### Caching Strategy

- **Cache Storage API**: Store downloaded assets
- **IndexedDB**: Store asset metadata (etag, size, timestamps)
- **Service Worker**: Cache-first for assets, stale-while-revalidate for JSON
- **Cache Version**: `xr-cache-v1` (bump to invalidate cache)

### Quality Modes

- **High**: Full pixel ratio, PCF soft shadows
- **Medium**: 1.5x max pixel ratio, PCF shadows
- **Low**: 1.0 pixel ratio, shadows disabled

## Deployment

### Static Hosting

Build and deploy to any static host:

```bash
npm run build
# Upload dist/ folder to your host
```

### CORS Requirements

External assets must have proper CORS headers:

```
Access-Control-Allow-Origin: *
```

GitHub raw URLs already have CORS enabled.

### HTTPS Required

WebXR requires HTTPS (except localhost). Ensure your production deployment uses HTTPS.

## Acceptance Tests

- [ ] Assets download with progress tracking
- [ ] Assets cache properly (check cache info)
- [ ] Works offline after first download
- [ ] VR mode works on Quest/headset
- [ ] Desktop mode works with mouse + keyboard
- [ ] Pointer lock controls work
- [ ] OrbitControls work when pointer is unlocked
- [ ] Lightplan loads and animates
- [ ] Quality settings change renderer settings
- [ ] Clear cache removes all cached data
- [ ] Fallback environment loads on error
- [ ] Service Worker registers successfully

## Troubleshooting

### Assets not downloading

- Check browser console for errors
- Verify CORS headers on asset URLs
- Check network tab in DevTools

### VR not working

- Ensure HTTPS (or localhost)
- Check WebXR browser support
- Verify headset is connected

### Performance issues

- Try Lower quality mode
- Check shadow settings
- Reduce lightplan complexity

## License

MIT License - see LICENSE file for details

## Credits

- **Three.js**: 3D rendering library
- **Sponza Model**: Intel/Crytek (via GitHub)
- **Vite**: Build tool
