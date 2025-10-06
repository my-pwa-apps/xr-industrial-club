# Fallback Environment

This directory should contain a small fallback GLB file (~10KB) named `fallback-hall.glb`.

## Creating a Fallback GLB

You can create a simple fallback environment using:

1. **Blender**: Create a simple box room, export as GLB
2. **Three.js Editor**: Create geometry, export as GLB
3. **Online Tools**: Use gltf.report or other GLB generators

The fallback is used when:
- External environment fails to load
- No internet connection on first run
- Asset download is interrupted

## Recommended Fallback

A simple 10m x 10m x 10m box room with:
- Floor (gray)
- 4 walls (dark gray)
- Ceiling (dark gray)
- Total file size < 10KB

This ensures the app can start even without downloaded assets.
