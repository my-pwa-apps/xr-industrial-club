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
    this.vrFlyMode = false; // Toggle for VR fly mode
    this.lastTurnTime = 0; // For snap turning
    this.lastFlyToggle = 0; // For fly mode toggle
    this.vrNotification = null; // For VR notifications
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
   * Update VR movement (improved intuitive controls)
   */
  updateVRMovement(delta) {
    // Get the XR session
    const session = this.renderer.xr.getSession();
    if (!session) return;
    
    // VR movement speeds
    const moveSpeed = this.vrFlyMode ? 5.0 : 3.0;
    const turnSpeed = 60; // degrees per second
    const deadzone = 0.15;
    
    // Get controller input sources
    const inputSources = session.inputSources;
    
    let leftGamepad = null;
    let rightGamepad = null;
    
    // Find left and right controllers
    for (const inputSource of inputSources) {
      if (inputSource.gamepad) {
        if (inputSource.handedness === 'left') {
          leftGamepad = inputSource.gamepad;
        } else if (inputSource.handedness === 'right') {
          rightGamepad = inputSource.gamepad;
        }
      }
    }
    
    // LEFT CONTROLLER - Movement and turning
    if (leftGamepad && leftGamepad.axes.length >= 2) {
      const leftX = leftGamepad.axes[0]; // left/right
      const leftY = leftGamepad.axes[1]; // forward/back
      
      // SNAP TURNING (more common in VR)
      if (Math.abs(leftX) > 0.7) {
        // Only turn if we haven't turned recently (prevent continuous turning)
        if (!this.lastTurnTime || Date.now() - this.lastTurnTime > 300) {
          const turnAngle = leftX > 0 ? -30 : 30; // 30 degree snaps
          if (this.cameraRig) {
            this.cameraRig.rotateY(turnAngle * Math.PI / 180);
            this.lastTurnTime = Date.now();
            console.log('VR snap turn:', turnAngle, 'degrees');
          }
        }
      }
      
      // FORWARD/BACKWARD MOVEMENT
      if (Math.abs(leftY) > deadzone) {
        // Get camera direction (where user is looking)
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        let movement;
        if (this.vrFlyMode) {
          // Fly mode: move in the direction you're looking (including up/down)
          movement = cameraDirection.clone().multiplyScalar(-leftY * moveSpeed * delta);
        } else {
          // Ground mode: only move on horizontal plane
          const forward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();
          movement = forward.multiplyScalar(-leftY * moveSpeed * delta);
        }
        
        if (this.cameraRig) {
          this.cameraRig.position.add(movement);
        }
      }
    }
    
    // RIGHT CONTROLLER - Strafing and vertical movement
    if (rightGamepad && rightGamepad.axes.length >= 2) {
      const rightX = rightGamepad.axes[0]; // strafe left/right
      const rightY = rightGamepad.axes[1]; // fly up/down (fly mode only)
      
      // STRAFING (left/right movement)
      if (Math.abs(rightX) > deadzone) {
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        const right = new THREE.Vector3().crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
        const movement = right.multiplyScalar(rightX * moveSpeed * delta);
        
        if (this.cameraRig) {
          this.cameraRig.position.add(movement);
        }
      }
      
      // VERTICAL MOVEMENT (fly mode only)
      if (this.vrFlyMode && Math.abs(rightY) > deadzone) {
        const movement = new THREE.Vector3(0, -rightY * moveSpeed * delta, 0);
        if (this.cameraRig) {
          this.cameraRig.position.add(movement);
        }
      }
    }
    
    // BUTTON CONTROLS - Check for button presses
    if (rightGamepad && rightGamepad.buttons.length > 0) {
      // A button (or primary button) - toggle fly mode
      if (rightGamepad.buttons[0] && rightGamepad.buttons[0].pressed) {
        if (!this.lastFlyToggle || Date.now() - this.lastFlyToggle > 500) {
          this.vrFlyMode = !this.vrFlyMode;
          this.lastFlyToggle = Date.now();
          console.log('VR fly mode:', this.vrFlyMode ? 'ON' : 'OFF');
          
          // Show notification to user
          this.showVRNotification(`Fly Mode: ${this.vrFlyMode ? 'ON' : 'OFF'}`);
        }
      }
    }
  }
  
  /**
   * Show notification in VR (temporary text display)
   */
  showVRNotification(text) {
    // Create temporary text notification
    if (this.vrNotification) {
      this.scene.remove(this.vrNotification);
    }
    
    // Create a simple text sprite for notification
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, 512, 128);
    
    context.fillStyle = '#00ff88';
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.fillText(text, 256, 80);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    this.vrNotification = new THREE.Sprite(material);
    
    // Position in front of camera
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    const notificationPos = this.camera.getWorldPosition(new THREE.Vector3());
    notificationPos.add(cameraDirection.multiplyScalar(2));
    notificationPos.y += 0.5;
    
    this.vrNotification.position.copy(notificationPos);
    this.vrNotification.scale.set(2, 0.5, 1);
    this.scene.add(this.vrNotification);
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (this.vrNotification) {
        this.scene.remove(this.vrNotification);
        this.vrNotification = null;
      }
    }, 2000);
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
