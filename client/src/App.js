/**
 * App.js - Main application class
 */

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { loadEnvironment, applyEnvironmentScale, createPlaceholderEnvironment } from './SceneLoader.js';
import { Controls } from './Controls.js';
import { LightManager } from './Lights.js';
import { UIManager } from './UI.js';

export class App {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.lightManager = null;
    this.ui = null;
    
    this.environment = null;
    this.clock = new THREE.Clock();
    
    this.isVR = false;
  }
  
  /**
   * Initialize the application
   */
  async init() {
    // Create UI manager
    this.ui = new UIManager();
    this.ui.showSplash('Initializing...');
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.6, 5);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.xr.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    
    // Add VR button
    const vrButton = VRButton.createButton(this.renderer);
    document.body.appendChild(vrButton);
    
    // Listen for VR session start/end
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.onEnterVR();
    });
    this.renderer.xr.addEventListener('sessionend', () => {
      this.onExitVR();
    });
    
    // Create controls
    this.controls = new Controls(this.camera, this.renderer, this.scene);
    
    // Create light manager
    this.lightManager = new LightManager(this.scene);
    
    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
    
    // Handle quality changes
    window.addEventListener('quality-change', (event) => {
      this.onQualityChange(event.detail.quality);
    });
    
    // Apply initial quality
    this.onQualityChange(this.ui.getQuality());
    
    console.log('App initialized');
  }
  
  /**
   * Load environment
   */
  async loadEnvironment(url) {
    this.ui.updateSplashProgress(0.2, 'Loading environment...');
    
    try {
      // Load environment
      this.environment = await loadEnvironment(url, this.renderer);
      
      // Apply scale
      applyEnvironmentScale(this.environment, 20);
      
      // Add to scene
      this.scene.add(this.environment);
      
      console.log('Environment loaded');
      
    } catch (error) {
      console.error('Failed to load environment:', error);
      
      // Use placeholder
      console.log('Using placeholder environment');
      this.environment = createPlaceholderEnvironment();
      this.scene.add(this.environment);
    }
  }
  
  /**
   * Load lightplan
   */
  async loadLightplan(url) {
    this.ui.updateSplashProgress(0.6, 'Loading lights...');
    
    try {
      await this.lightManager.loadLightplan(url);
    } catch (error) {
      console.error('Failed to load lightplan:', error);
    }
  }
  
  /**
   * Start the application
   */
  start() {
    // Hide splash
    this.ui.hideSplash();
    
    // Show HUD
    this.ui.showHUD();
    
    // Start render loop
    this.renderer.setAnimationLoop((time, frame) => {
      this.render(time, frame);
    });
    
    console.log('App started');
  }
  
  /**
   * Render loop
   */
  render(time, frame) {
    const delta = this.clock.getDelta();
    
    // Update controls
    if (this.controls) {
      this.controls.update(delta);
    }
    
    // Update lights
    if (this.lightManager) {
      this.lightManager.update(delta);
    }
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Handle window resize
   */
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Handle quality change
   */
  onQualityChange(quality) {
    console.log('Changing quality to:', quality);
    
    switch (quality) {
      case 'high':
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        if (this.renderer.shadowMap.type !== THREE.PCFSoftShadowMap) {
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          this.renderer.shadowMap.needsUpdate = true;
        }
        break;
      
      case 'medium':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        if (this.renderer.shadowMap.type !== THREE.PCFShadowMap) {
          this.renderer.shadowMap.type = THREE.PCFShadowMap;
          this.renderer.shadowMap.needsUpdate = true;
        }
        break;
      
      case 'low':
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
        break;
    }
  }
  
  /**
   * Handle entering VR
   */
  onEnterVR() {
    console.log('Entered VR mode');
    this.isVR = true;
    
    if (this.controls) {
      this.controls.enterVR();
    }
    
    // Hide HUD in VR
    this.ui.hideHUD();
  }
  
  /**
   * Handle exiting VR
   */
  onExitVR() {
    console.log('Exited VR mode');
    this.isVR = false;
    
    if (this.controls) {
      this.controls.exitVR();
    }
    
    // Show HUD
    this.ui.showHUD();
  }
  
  /**
   * Dispose of the application
   */
  dispose() {
    // Stop render loop
    this.renderer.setAnimationLoop(null);
    
    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }
    
    // Dispose lights
    if (this.lightManager) {
      this.lightManager.dispose();
    }
    
    // Dispose scene
    this.scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    // Dispose renderer
    this.renderer.dispose();
    
    console.log('App disposed');
  }
}
