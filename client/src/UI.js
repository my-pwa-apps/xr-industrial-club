/**
 * UI.js - User interface management
 */

import { prefetchAssets, clearAllCaches, getCacheInfo } from './Cache.js';

/**
 * UI Manager
 */
export class UIManager {
  constructor() {
    this.elements = {
      splash: document.getElementById('splash'),
      splashProgress: document.getElementById('splash-progress'),
      splashStatus: document.getElementById('splash-status'),
      
      hud: document.getElementById('hud'),
      downloadBtn: document.getElementById('download-assets'),
      clearCacheBtn: document.getElementById('clear-cache'),
      toggleControlsBtn: document.getElementById('toggle-controls'),
      qualityBtn: document.getElementById('quality-toggle'),
      enterVrBtn: document.getElementById('enter-vr'),
      cacheInfo: document.getElementById('cache-info'),
      
      progressOverlay: document.getElementById('progress-overlay'),
      progressTotal: document.getElementById('progress-total'),
      progressStatus: document.getElementById('progress-status'),
      progressFiles: document.getElementById('progress-files'),
      
      controlsHelp: document.getElementById('controls-help'),
    };
    
    // Check if all required elements exist
    const missingElements = [];
    for (const [key, element] of Object.entries(this.elements)) {
      if (!element) {
        missingElements.push(key);
      }
    }
    
    if (missingElements.length > 0) {
      console.error('Missing DOM elements:', missingElements);
      throw new Error(`Required DOM elements not found: ${missingElements.join(', ')}`);
    }
    
    this.qualityMode = 'high'; // 'high', 'medium', 'low'
    this.controlsVisible = false;
    
    this.initEventListeners();
  }
  
  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Download assets button
    this.elements.downloadBtn.addEventListener('click', () => {
      this.onDownloadAssets();
    });
    
    // Clear cache button
    this.elements.clearCacheBtn.addEventListener('click', () => {
      this.onClearCache();
    });
    
    // Toggle controls help
    this.elements.toggleControlsBtn.addEventListener('click', () => {
      this.toggleControls();
    });
    
    // Quality toggle
    this.elements.qualityBtn.addEventListener('click', () => {
      this.cycleQuality();
    });
  }
  
  /**
   * Show splash screen
   */
  showSplash(status = 'Initializing...') {
    this.elements.splash.classList.add('active');
    this.elements.splashStatus.textContent = status;
  }
  
  /**
   * Hide splash screen
   */
  hideSplash() {
    this.elements.splash.classList.remove('active');
  }
  
  /**
   * Update splash progress
   */
  updateSplashProgress(progress, status) {
    this.elements.splashProgress.style.width = `${progress * 100}%`;
    if (status) {
      this.elements.splashStatus.textContent = status;
    }
  }
  
  /**
   * Show HUD
   */
  showHUD() {
    this.elements.hud.classList.add('active');
    this.updateCacheInfo();
  }
  
  /**
   * Hide HUD
   */
  hideHUD() {
    this.elements.hud.classList.remove('active');
  }
  
  /**
   * Show progress overlay
   */
  showProgressOverlay() {
    this.elements.progressOverlay.classList.add('active');
    this.elements.progressTotal.style.width = '0%';
    this.elements.progressStatus.textContent = 'Preparing...';
    this.elements.progressFiles.innerHTML = '';
  }
  
  /**
   * Hide progress overlay
   */
  hideProgressOverlay() {
    this.elements.progressOverlay.classList.remove('active');
  }
  
  /**
   * Update progress overlay
   */
  updateProgress(completed, total, currentFile) {
    const progress = total > 0 ? completed / total : 0;
    
    this.elements.progressTotal.style.width = `${progress * 100}%`;
    this.elements.progressStatus.textContent = 
      `Downloading ${Math.floor(completed)}/${total} files...`;
  }
  
  /**
   * Add file to progress list
   */
  addFileToProgress(url, name, state = 'queued') {
    const fileDiv = document.createElement('div');
    fileDiv.className = `file-item ${state}`;
    fileDiv.dataset.url = url;
    fileDiv.innerHTML = `
      <span class="file-name">${name}</span>
      <span class="file-status">${state}</span>
    `;
    
    this.elements.progressFiles.appendChild(fileDiv);
    
    return fileDiv;
  }
  
  /**
   * Update file progress state
   */
  updateFileState(url, state, message) {
    const fileDiv = this.elements.progressFiles.querySelector(`[data-url="${url}"]`);
    if (fileDiv) {
      fileDiv.className = `file-item ${state}`;
      const statusSpan = fileDiv.querySelector('.file-status');
      if (statusSpan) {
        statusSpan.textContent = message || state;
      }
    }
  }
  
  /**
   * Handle download assets button
   */
  async onDownloadAssets() {
    try {
      // Read assets.json
      const response = await fetch('/assets.json');
      const config = await response.json();
      
      // Build asset list
      const assetList = [];
      
      if (config.environmentUrl) {
        assetList.push({
          url: config.environmentUrl,
          name: 'Environment Model',
        });
      }
      
      if (config.lightplanUrl) {
        assetList.push({
          url: config.lightplanUrl,
          name: 'Light Plan',
        });
      }
      
      if (config.additional) {
        for (const asset of config.additional) {
          assetList.push({
            url: asset.url,
            name: asset.name || 'Additional Asset',
          });
        }
      }
      
      if (assetList.length === 0) {
        alert('No assets to download');
        return;
      }
      
      // Show progress overlay
      this.showProgressOverlay();
      
      // Add files to progress list
      const fileDivs = {};
      for (const asset of assetList) {
        const fileDiv = this.addFileToProgress(asset.url, asset.name, 'queued');
        fileDivs[asset.url] = fileDiv;
      }
      
      // Download assets
      await prefetchAssets(assetList, {
        onProgress: (completed, total, currentFile) => {
          this.updateProgress(completed, total, currentFile);
        },
        
        onFileStart: (url, name) => {
          this.updateFileState(url, 'downloading', 'Downloading...');
        },
        
        onFileComplete: (url, name, size) => {
          const sizeMB = (size / 1024 / 1024).toFixed(2);
          this.updateFileState(url, 'cached', `${sizeMB} MB`);
        },
        
        onFileError: (url, name, error) => {
          this.updateFileState(url, 'failed', error.message);
        },
      });
      
      // Update cache info
      await this.updateCacheInfo();
      
      // Hide progress overlay after delay
      setTimeout(() => {
        this.hideProgressOverlay();
      }, 2000);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download assets: ' + error.message);
      this.hideProgressOverlay();
    }
  }
  
  /**
   * Handle clear cache button
   */
  async onClearCache() {
    if (!confirm('Clear all cached assets? You will need to download them again.')) {
      return;
    }
    
    try {
      await clearAllCaches();
      await this.updateCacheInfo();
      alert('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache: ' + error.message);
    }
  }
  
  /**
   * Update cache info display
   */
  async updateCacheInfo() {
    try {
      const info = await getCacheInfo();
      
      if (info) {
        const sizeMB = (info.totalSize / 1024 / 1024).toFixed(2);
        const date = info.latestUpdate 
          ? new Date(info.latestUpdate).toLocaleString()
          : 'Never';
        
        this.elements.cacheInfo.innerHTML = `
          <div><strong>Version:</strong> ${info.version}</div>
          <div><strong>Files:</strong> ${info.files}</div>
          <div><strong>Size:</strong> ${sizeMB} MB</div>
          <div><strong>Updated:</strong> ${date}</div>
        `;
      } else {
        this.elements.cacheInfo.innerHTML = '<div>No cache data</div>';
      }
    } catch (error) {
      console.error('Failed to get cache info:', error);
      this.elements.cacheInfo.innerHTML = '<div>Error loading cache info</div>';
    }
  }
  
  /**
   * Toggle controls help
   */
  toggleControls() {
    this.controlsVisible = !this.controlsVisible;
    
    if (this.controlsVisible) {
      this.elements.controlsHelp.classList.add('active');
    } else {
      this.elements.controlsHelp.classList.remove('active');
    }
  }
  
  /**
   * Cycle quality modes
   */
  cycleQuality() {
    const modes = ['high', 'medium', 'low'];
    const currentIndex = modes.indexOf(this.qualityMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.qualityMode = modes[nextIndex];
    
    this.elements.qualityBtn.textContent = `Quality: ${this.qualityMode.toUpperCase()}`;
    
    // Dispatch custom event for quality change
    window.dispatchEvent(new CustomEvent('quality-change', { 
      detail: { quality: this.qualityMode } 
    }));
    
    console.log('Quality mode:', this.qualityMode);
  }
  
  /**
   * Get current quality mode
   */
  getQuality() {
    return this.qualityMode;
  }
  
  /**
   * Set VR button visibility
   */
  setVRButtonVisible(visible) {
    if (visible) {
      this.elements.enterVrBtn.style.display = 'block';
    } else {
      this.elements.enterVrBtn.style.display = 'none';
    }
  }
  
  /**
   * Get VR button element (for XR button integration)
   */
  getVRButton() {
    return this.elements.enterVrBtn;
  }
}
