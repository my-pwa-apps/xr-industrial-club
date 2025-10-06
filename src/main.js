/**
 * main.js - Application entry point
 */

import { registerServiceWorker, readAssetsJson } from './Cache.js';
import { App } from './App.js';

/**
 * Boot sequence
 */
async function boot() {
  console.log('Starting XR Industrial Club...');
  
  try {
    // Register service worker
    console.log('Registering service worker...');
    await registerServiceWorker();
    
    // Create app
    const app = new App();
    await app.init();
    
    // Load assets configuration
    console.log('Loading assets configuration...');
    const assetsConfig = await readAssetsJson('./assets.json');
    
    // Load environment
    if (assetsConfig.environmentUrl) {
      await app.loadEnvironment(assetsConfig.environmentUrl);
    } else {
      console.warn('No environment URL in assets.json');
    }
    
    // Load lightplan
    if (assetsConfig.lightplanUrl) {
      console.log('About to load lightplan...');
      await app.loadLightplan(assetsConfig.lightplanUrl);
      console.log('Lightplan loading completed in main.js');
    } else {
      console.warn('No lightplan URL in assets.json');
    }
    
    // Start app
    console.log('About to start app...');
    app.start();
    console.log('App.start() called');
    
    // Make app globally accessible for debugging
    window.app = app;
    
    console.log('App ready!');
    
  } catch (error) {
    console.error('Failed to boot application:', error);
    
    // Show error to user
    const splashStatus = document.getElementById('splash-status');
    if (splashStatus) {
      splashStatus.textContent = 'Error: ' + error.message;
      splashStatus.style.color = '#ff4444';
    }
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
