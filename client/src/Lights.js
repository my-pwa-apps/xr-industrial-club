/**
 * Lights.js - Dynamic lighting system with lightplan support
 */

import * as THREE from 'three';

/**
 * Light fixture manager
 */
export class LightManager {
  constructor(scene) {
    this.scene = scene;
    this.fixtures = [];
    this.time = 0;
    this.bpm = 128;
    this.beatDuration = 60 / this.bpm;
  }
  
  /**
   * Load lightplan from JSON
   */
  async loadLightplan(url) {
    console.log('Starting lightplan load from:', url);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Lightplan loading timeout')), 10000); // 10 second timeout
    });
    
    const loadPromise = this.loadLightplanInternal(url);
    
    try {
      await Promise.race([loadPromise, timeoutPromise]);
    } catch (error) {
      console.warn('Failed to load lightplan:', error);
      console.log('Using default lighting');
      this.createDefaultLighting();
    }
  }
  
  /**
   * Internal lightplan loading method
   */
  async loadLightplanInternal(url) {
    console.log('Fetching lightplan...');
    const response = await fetch(url);
    console.log('Response received:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Failed to load lightplan: ${response.statusText}`);
    }
    
    console.log('Parsing JSON...');
    const lightplan = await response.json();
    console.log('Lightplan parsed successfully:', lightplan);
    
    // Set BPM if specified
    if (lightplan.bpm) {
      this.bpm = lightplan.bpm;
      this.beatDuration = 60 / this.bpm;
      console.log('BPM set to:', this.bpm);
    }
    
    // Create fixtures
    if (lightplan.fixtures) {
      console.log('Creating fixtures...');
      for (const fixtureData of lightplan.fixtures) {
        console.log('Creating fixture:', fixtureData.type);
        const fixture = this.createFixture(fixtureData);
        if (fixture) {
          this.fixtures.push(fixture);
        }
      }
    }
    
    console.log(`Loaded ${this.fixtures.length} fixtures successfully`);
  }
  
  /**
   * Create a light fixture from data
   */
  createFixture(data) {
    const { type, position, color, intensity, target, beamAngle } = data;
    
    switch (type) {
      case 'movingHead':
        return this.createMovingHead(position, color, intensity, target, beamAngle);
      
      case 'strobe':
        return this.createStrobe(position, color, intensity);
      
      case 'laser':
        return this.createLaser(position, color, intensity, target);
      
      default:
        console.warn('Unknown fixture type:', type);
        return null;
    }
  }
  
  /**
   * Create a moving head spotlight
   */
  createMovingHead(position, color, intensity, target, beamAngle) {
    const spotlight = new THREE.SpotLight(
      new THREE.Color(color),
      intensity || 1.0,
      50, // distance
      THREE.MathUtils.degToRad(beamAngle || 30),
      0.5, // penumbra
      1.0 // decay
    );
    
    spotlight.position.set(position[0], position[1], position[2]);
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 512;
    spotlight.shadow.mapSize.height = 512;
    
    // Target
    const targetObj = new THREE.Object3D();
    if (target) {
      targetObj.position.set(target[0], target[1], target[2]);
    } else {
      targetObj.position.set(position[0], 0, position[2]);
    }
    
    this.scene.add(targetObj);
    spotlight.target = targetObj;
    
    this.scene.add(spotlight);
    
    // Add visual cone helper (optional, for debugging)
    // const helper = new THREE.SpotLightHelper(spotlight);
    // this.scene.add(helper);
    
    return {
      type: 'movingHead',
      light: spotlight,
      target: targetObj,
      basePosition: new THREE.Vector3(position[0], position[1], position[2]),
      baseTarget: new THREE.Vector3(target ? target[0] : position[0], target ? target[1] : 0, target ? target[2] : position[2]),
      baseColor: new THREE.Color(color),
      baseIntensity: intensity || 1.0,
    };
  }
  
  /**
   * Create a strobe light
   */
  createStrobe(position, color, intensity) {
    const pointLight = new THREE.PointLight(
      new THREE.Color(color),
      0, // Start off
      20, // distance
      2.0 // decay
    );
    
    pointLight.position.set(position[0], position[1], position[2]);
    this.scene.add(pointLight);
    
    return {
      type: 'strobe',
      light: pointLight,
      baseColor: new THREE.Color(color),
      baseIntensity: intensity || 5.0,
      strobePhase: Math.random() * Math.PI * 2,
    };
  }
  
  /**
   * Create a laser effect
   */
  createLaser(position, color, intensity, target) {
    // Laser beam geometry
    const start = new THREE.Vector3(position[0], position[1], position[2]);
    const end = target 
      ? new THREE.Vector3(target[0], target[1], target[2])
      : new THREE.Vector3(position[0], 0, position[2] + 10);
    
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    
    // Add point light at laser origin
    const pointLight = new THREE.PointLight(
      new THREE.Color(color),
      intensity || 1.0,
      10,
      2.0
    );
    pointLight.position.copy(start);
    this.scene.add(pointLight);
    
    return {
      type: 'laser',
      line,
      light: pointLight,
      baseColor: new THREE.Color(color),
      baseIntensity: intensity || 1.0,
      start: start.clone(),
      end: end.clone(),
    };
  }
  
  /**
   * Create default lighting (fallback)
   */
  createDefaultLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    
    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = true;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);
    
    // Fill lights
    const fillLight1 = new THREE.PointLight(0x4444ff, 0.5, 30);
    fillLight1.position.set(-10, 3, 0);
    this.scene.add(fillLight1);
    
    const fillLight2 = new THREE.PointLight(0xff4444, 0.5, 30);
    fillLight2.position.set(10, 3, 0);
    this.scene.add(fillLight2);
    
    console.log('Default lighting created');
  }
  
  /**
   * Update lighting animation
   */
  update(deltaTime) {
    this.time += deltaTime;
    const beat = (this.time / this.beatDuration) % 1;
    
    for (const fixture of this.fixtures) {
      switch (fixture.type) {
        case 'movingHead':
          this.updateMovingHead(fixture, this.time);
          break;
        
        case 'strobe':
          this.updateStrobe(fixture, beat);
          break;
        
        case 'laser':
          this.updateLaser(fixture, this.time);
          break;
      }
    }
  }
  
  /**
   * Update moving head animation
   */
  updateMovingHead(fixture, time) {
    const { light, target, baseTarget } = fixture;
    
    // Circular pan/tilt movement
    const radius = 5;
    const speed = 0.5;
    
    target.position.x = baseTarget.x + Math.cos(time * speed) * radius;
    target.position.z = baseTarget.z + Math.sin(time * speed) * radius;
    
    // Pulsing intensity
    const pulse = Math.sin(time * 2) * 0.3 + 0.7;
    light.intensity = fixture.baseIntensity * pulse;
  }
  
  /**
   * Update strobe animation
   */
  updateStrobe(fixture, beat) {
    const { light, strobePhase, baseIntensity } = fixture;
    
    // Strobe on beat
    const strobeTime = (beat + strobePhase / (Math.PI * 2)) % 1;
    
    if (strobeTime < 0.05) {
      light.intensity = baseIntensity;
    } else {
      light.intensity = 0;
    }
  }
  
  /**
   * Update laser animation
   */
  updateLaser(fixture, time) {
    const { line, light, start, end } = fixture;
    
    // Sweep laser
    const angle = Math.sin(time * 1.5) * Math.PI / 4;
    
    const newEnd = end.clone();
    newEnd.x = end.x + Math.sin(angle) * 10;
    
    const positions = line.geometry.attributes.position.array;
    positions[3] = newEnd.x;
    positions[4] = newEnd.y;
    positions[5] = newEnd.z;
    line.geometry.attributes.position.needsUpdate = true;
    
    // Pulsing intensity
    const pulse = Math.sin(time * 3) * 0.4 + 0.6;
    light.intensity = fixture.baseIntensity * pulse;
  }
  
  /**
   * Dispose of all fixtures
   */
  dispose() {
    for (const fixture of this.fixtures) {
      if (fixture.light) {
        this.scene.remove(fixture.light);
      }
      if (fixture.target) {
        this.scene.remove(fixture.target);
      }
      if (fixture.line) {
        fixture.line.geometry.dispose();
        fixture.line.material.dispose();
        this.scene.remove(fixture.line);
      }
    }
    
    this.fixtures = [];
  }
}
