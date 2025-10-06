/**
 * Controls.js - VR and desktop control systems
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Controls {
  constructor(camera, renderer, scene, cameraRig = null) {
    this.camera = camera;
    this.renderer = renderer;
    this.scene = scene;
    this.cameraRig = cameraRig || camera.parent; // Use provided rig or find parent
    
    this.mode = 'desktop'; // 'desktop' or 'vr'
    this.orbitControls = null;
    this.pointerLocked = false;
    
    // Desktop movement
    this.moveSpeed = 5.0;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    // VR controllers
    this.controller1 = null;
    this.controller2 = null;
    this.controllerGrip1 = null;
    this.controllerGrip2 = null;
    
    // Initialize
    this.initDesktopControls();
  }
  
  /**
   * Initialize desktop controls (OrbitControls)
   */
  initDesktopControls() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.target.set(0, 1.6, 0);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 0.5;
    this.orbitControls.maxDistance = 50;
    this.orbitControls.maxPolarAngle = Math.PI * 0.95;
    this.orbitControls.update();
    
    console.log('Desktop controls initialized (OrbitControls)');
  }
  
  /**
   * Toggle between OrbitControls and PointerLock controls
   */
  togglePointerLock() {
    if (this.mode !== 'desktop') return;
    
    if (!this.pointerLocked) {
      this.requestPointerLock();
    } else {
      this.exitPointerLock();
    }
  }
  
  /**
   * Request pointer lock for FPS-style controls
   */
  requestPointerLock() {
    const canvas = this.renderer.domElement;
    canvas.requestPointerLock();
    
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
    
    // Setup keyboard controls
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
  }
  
  /**
   * Exit pointer lock
   */
  exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    this.cleanupPointerLock();
  }
  
  /**
   * Cleanup pointer lock listeners
   */
  cleanupPointerLock() {
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    
    // Reset movement
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
  }
  
  /**
   * Pointer lock change handler
   */
  onPointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    
    if (this.pointerLocked) {
      console.log('Pointer locked - WASD to move, Mouse to look');
      if (this.orbitControls) {
        this.orbitControls.enabled = false;
      }
    } else {
      console.log('Pointer unlocked - OrbitControls active');
      if (this.orbitControls) {
        this.orbitControls.enabled = true;
      }
      this.cleanupPointerLock();
    }
  };
  
  /**
   * Pointer lock error handler
   */
  onPointerLockError = () => {
    console.error('Pointer lock failed');
  };
  
  /**
   * Keyboard down handler
   */
  onKeyDown = (event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'Space':
        this.moveUp = true;
        event.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = true;
        break;
      case 'Escape':
        this.exitPointerLock();
        break;
    }
  };
  
  /**
   * Keyboard up handler
   */
  onKeyUp = (event) => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'Space':
        this.moveUp = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = false;
        break;
    }
  };
  
  /**
   * Mouse move handler (look around in pointer lock)
   */
  onMouseMove = (event) => {
    if (!this.pointerLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(this.camera.quaternion);
    
    euler.y -= movementX * 0.002;
    euler.x -= movementY * 0.002;
    
    // Clamp vertical rotation
    euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
    
    this.camera.quaternion.setFromEuler(euler);
  };
  
  /**
   * Initialize VR controllers
   */
  initVRControllers() {
    this.controller1 = this.renderer.xr.getController(0);
    this.controller2 = this.renderer.xr.getController(1);
    
    this.controllerGrip1 = this.renderer.xr.getControllerGrip(0);
    this.controllerGrip2 = this.renderer.xr.getControllerGrip(1);
    
    this.scene.add(this.controller1);
    this.scene.add(this.controller2);
    this.scene.add(this.controllerGrip1);
    this.scene.add(this.controllerGrip2);
    
    // Add controller models
    // You can add ControllerModelFactory here if needed
    
    console.log('VR controllers initialized');
  }
  
  /**
   * Update controls (call in render loop)
   */
  update(delta) {
    if (this.mode === 'desktop') {
      if (this.pointerLocked) {
        this.updatePointerLockMovement(delta);
      } else if (this.orbitControls) {
        this.orbitControls.update();
      }
    } else if (this.mode === 'vr') {
      this.updateVRMovement(delta);
    }
  }
  
  /**
   * Update movement in pointer lock mode
   */
  updatePointerLockMovement(delta) {
    // Decelerate
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;
    this.velocity.y -= this.velocity.y * 10.0 * delta;
    
    // Calculate direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.y = Number(this.moveUp) - Number(this.moveDown);
    this.direction.normalize();
    
    // Apply movement
    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * this.moveSpeed * delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * this.moveSpeed * delta;
    }
    if (this.moveUp || this.moveDown) {
      this.velocity.y += this.direction.y * this.moveSpeed * delta;
    }
    
    // Get camera forward and right vectors
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, this.camera.up).normalize();
    
    // Apply velocity
    const movement = new THREE.Vector3();
    movement.addScaledVector(forward, -this.velocity.z);
    movement.addScaledVector(right, -this.velocity.x);
    movement.y += this.velocity.y;
    
    this.camera.position.add(movement);
  }
  
  /**
   * Update VR movement (thumbstick locomotion)
   */
  updateVRMovement(delta) {
    // Get the XR session
    const session = this.renderer.xr.getSession();
    if (!session) return;
    
    // VR movement speed
    const moveSpeed = 3.0;
    
    // Get controller input sources
    const inputSources = session.inputSources;
    
    for (const inputSource of inputSources) {
      if (inputSource.gamepad) {
        const gamepad = inputSource.gamepad;
        
        // Use the primary controller (usually right hand) for movement
        if (inputSource.handedness === 'right' && gamepad.axes.length >= 4) {
          // Right thumbstick axes (typically axes 2 and 3)
          const thumbstickX = gamepad.axes[2];
          const thumbstickY = gamepad.axes[3];
          
          // Apply deadzone
          const deadzone = 0.2;
          if (Math.abs(thumbstickX) > deadzone || Math.abs(thumbstickY) > deadzone) {
            // Get camera direction
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            
            // Calculate movement direction relative to camera
            const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
            const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
            
            // Calculate movement vector
            const movement = new THREE.Vector3();
            movement.addScaledVector(forward, -thumbstickY * moveSpeed * delta);
            movement.addScaledVector(right, thumbstickX * moveSpeed * delta);
            
            // Apply movement to camera rig
            if (this.cameraRig) {
              this.cameraRig.position.add(movement);
            }
          }
        }
        
        // Use left controller for turning (optional)
        if (inputSource.handedness === 'left' && gamepad.axes.length >= 2) {
          const turnThumbstickX = gamepad.axes[0];
          const turnSpeed = 90; // degrees per second
          const deadzone = 0.3;
          
          if (Math.abs(turnThumbstickX) > deadzone) {
            if (this.cameraRig) {
              const turnAngle = turnThumbstickX * turnSpeed * delta * (Math.PI / 180);
              this.cameraRig.rotateY(-turnAngle);
            }
          }
        }
      }
    }
  }
  
  /**
   * Switch to VR mode
   */
  enterVR() {
    this.mode = 'vr';
    
    if (this.orbitControls) {
      this.orbitControls.enabled = false;
    }
    
    if (this.pointerLocked) {
      this.exitPointerLock();
    }
    
    this.initVRControllers();
    
    console.log('Entered VR mode');
  }
  
  /**
   * Switch to desktop mode
   */
  exitVR() {
    this.mode = 'desktop';
    
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
    }
    
    console.log('Exited VR mode');
  }
  
  /**
   * Dispose of controls
   */
  dispose() {
    if (this.orbitControls) {
      this.orbitControls.dispose();
    }
    
    if (this.pointerLocked) {
      this.exitPointerLock();
    }
  }
}
