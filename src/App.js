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
   * Add immediate visible content to the scene
   */
  addImmediateContent() {
    console.log('Adding immediate visible content...');
    
    // Add basic lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Change scene background to see if rendering is working
    this.scene.background = new THREE.Color(0x111122);
    
    // Add a simple floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x666666,
      side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Add some larger, brighter colored cubes to see something
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    
    // Red cube
    const redMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const redCube = new THREE.Mesh(cubeGeometry, redMaterial);
    redCube.position.set(-4, 1, 0);
    redCube.castShadow = true;
    this.scene.add(redCube);
    
    // Green cube
    const greenMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const greenCube = new THREE.Mesh(cubeGeometry, greenMaterial);
    greenCube.position.set(0, 1, 0);
    greenCube.castShadow = true;
    this.scene.add(greenCube);
    
    // Blue cube
    const blueMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
    const blueCube = new THREE.Mesh(cubeGeometry, blueMaterial);
    blueCube.position.set(4, 1, 0);
    blueCube.castShadow = true;
    this.scene.add(blueCube);
    
    // Add a tall white cube so we definitely see something
    const tallCube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 6, 1), 
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    tallCube.position.set(0, 3, -3);
    this.scene.add(tallCube);
    
    console.log('Scene object count:', this.scene.children.length);
    console.log('Camera position:', this.camera.position);
    console.log('Immediate content added - should see floor and colored cubes');
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
    
    // Add to app div instead of body
    const appDiv = document.getElementById('app');
    if (appDiv) {
      appDiv.appendChild(this.renderer.domElement);
      console.log('Renderer canvas added to #app div');
    } else {
      document.body.appendChild(this.renderer.domElement);
      console.log('Renderer canvas added to body (fallback)');
    }
    
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
    
    // Add some immediate visible content
    this.addImmediateContent();
    
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
    console.log('App.loadLightplan called with URL:', url);
    this.ui.updateSplashProgress(0.6, 'Loading lights...');
    
    try {
      console.log('Calling lightManager.loadLightplan...');
      await this.lightManager.loadLightplan(url);
      console.log('Lightplan loading completed');
      this.ui.updateSplashProgress(0.8, 'Lights loaded');
    } catch (error) {
      console.error('Failed to load lightplan:', error);
      this.ui.updateSplashProgress(0.8, 'Light loading failed');
    }
  }
  
  /**
   * Start the application
   */
  start() {
    console.log('App.start() method called');
    
    // Hide splash
    console.log('Hiding splash...');
    this.ui.hideSplash();
    
    // Show HUD
    console.log('Showing HUD...');
    this.ui.showHUD();
    
    // Start render loop
    console.log('Starting render loop...');
    this.renderer.setAnimationLoop((time, frame) => {
      this.render(time, frame);
    });
    
    console.log('App started successfully');
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
