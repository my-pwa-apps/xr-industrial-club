/**
 * SceneLoader.js - Load 3D environments and configure loaders
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

/**
 * Create and configure loaders
 */
export function createLoaders(renderer) {
  // GLTF Loader
  const gltfLoader = new GLTFLoader();
  
  // Draco Loader (for compressed geometry)
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  gltfLoader.setDRACOLoader(dracoLoader);
  
  // KTX2 Loader (for compressed textures)
  const ktx2Loader = new KTX2Loader();
  ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/');
  ktx2Loader.detectSupport(renderer);
  gltfLoader.setKTX2Loader(ktx2Loader);
  
  return { gltfLoader, dracoLoader, ktx2Loader };
}

/**
 * Load environment from URL
 * @param {string} url - URL to GLB/GLTF file
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer
 * @param {Function} onProgress - Progress callback (loaded, total)
 * @returns {Promise<THREE.Object3D>} - Loaded scene root
 */
export async function loadEnvironment(url, renderer, onProgress = null) {
  const { gltfLoader } = createLoaders(renderer);
  
  try {
    console.log('Loading environment:', url);
    
    const gltf = await new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) => {
          if (onProgress && progress.lengthComputable) {
            onProgress(progress.loaded, progress.total);
          }
        },
        (error) => reject(error)
      );
    });
    
    const root = gltf.scene;
    
    // Configure shadows
    root.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Optimize materials
        if (node.material) {
          node.material.envMapIntensity = 1.0;
        }
      }
    });
    
    console.log('Environment loaded successfully');
    return root;
    
  } catch (error) {
    console.error('Failed to load environment:', error);
    
    // Try fallback
    console.log('Attempting to load fallback environment...');
    try {
      return await loadFallbackEnvironment(renderer);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Failed to load environment and fallback');
    }
  }
}

/**
 * Load fallback environment (local GLB)
 */
async function loadFallbackEnvironment(renderer) {
  const { gltfLoader } = createLoaders(renderer);
  
  const fallbackUrl = '/client-demo/fallback-hall.glb';
  
  const gltf = await new Promise((resolve, reject) => {
    gltfLoader.load(
      fallbackUrl,
      (gltf) => resolve(gltf),
      null,
      (error) => reject(error)
    );
  });
  
  const root = gltf.scene;
  
  root.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  
  return root;
}

/**
 * Apply scale to environment
 * @param {THREE.Object3D} root - Scene root
 * @param {number} targetSize - Target size in meters
 */
export function applyEnvironmentScale(root, targetSize = 20) {
  // Calculate bounding box
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  
  // Scale to target size
  if (maxDim > 0) {
    const scale = targetSize / maxDim;
    root.scale.setScalar(scale);
  }
  
  // Center on ground
  root.updateMatrixWorld(true);
  const centeredBox = new THREE.Box3().setFromObject(root);
  const center = centeredBox.getCenter(new THREE.Vector3());
  
  root.position.x = -center.x;
  root.position.z = -center.z;
  root.position.y = -centeredBox.min.y; // Place on ground
  
  console.log(`Environment scaled to ${targetSize}m (scale: ${scale.toFixed(2)})`);
}

/**
 * Create a simple placeholder environment
 */
export function createPlaceholderEnvironment() {
  const group = new THREE.Group();
  
  // Floor
  const floorGeometry = new THREE.PlaneGeometry(40, 40);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  
  // Walls
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.1,
  });
  
  // Back wall
  const wallGeometry = new THREE.PlaneGeometry(40, 10);
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.z = -20;
  backWall.position.y = 5;
  backWall.receiveShadow = true;
  group.add(backWall);
  
  // Side walls
  const sideWallGeometry = new THREE.PlaneGeometry(40, 10);
  
  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.position.x = -20;
  leftWall.position.y = 5;
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  group.add(leftWall);
  
  const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  rightWall.position.x = 20;
  rightWall.position.y = 5;
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  group.add(rightWall);
  
  // Ceiling
  const ceiling = new THREE.Mesh(floorGeometry, wallMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 10;
  group.add(ceiling);
  
  console.log('Created placeholder environment');
  return group;
}

/**
 * Dispose of loaded environment to free memory
 */
export function disposeEnvironment(root) {
  if (!root) return;
  
  root.traverse((node) => {
    if (node.geometry) {
      node.geometry.dispose();
    }
    
    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach((material) => disposeMaterial(material));
      } else {
        disposeMaterial(node.material);
      }
    }
  });
  
  console.log('Environment disposed');
}

/**
 * Dispose of material and its textures
 */
function disposeMaterial(material) {
  if (material.map) material.map.dispose();
  if (material.lightMap) material.lightMap.dispose();
  if (material.bumpMap) material.bumpMap.dispose();
  if (material.normalMap) material.normalMap.dispose();
  if (material.specularMap) material.specularMap.dispose();
  if (material.envMap) material.envMap.dispose();
  if (material.aoMap) material.aoMap.dispose();
  if (material.metalnessMap) material.metalnessMap.dispose();
  if (material.roughnessMap) material.roughnessMap.dispose();
  
  material.dispose();
}
