/**
 * Utility functions for Electron detection and interaction
 */

/**
 * Check if the app is running in Electron environment
 * @returns {boolean} True if running in Electron, false otherwise
 */
export const isElectron = () => {
  // Check if we're in a browser environment first
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for Electron-specific properties
  return !!(
    window.electronAPI ||
    window.electron ||
    (window.process && window.process.type === 'renderer') ||
    (window.navigator && window.navigator.userAgent && window.navigator.userAgent.indexOf('Electron') >= 0)
  );
};

/**
 * Get Electron version if available
 * @returns {string|null} Electron version or null if not in Electron
 */
export const getElectronVersion = () => {
  if (!isElectron()) {
    return null;
  }

  return window.process?.versions?.electron || null;
};

/**
 * Check if Electron APIs are available
 * @returns {boolean} True if Electron APIs are available
 */
export const hasElectronAPI = () => {
  return isElectron() && !!(window.electronAPI || window.electron);
};

/**
 * Safe way to call Electron APIs
 * @param {Function} callback - Function to call if Electron APIs are available
 * @param {Function} fallback - Function to call if not in Electron (optional)
 */
export const withElectron = (callback, fallback = () => {}) => {
  if (hasElectronAPI()) {
    return callback();
  } else {
    return fallback();
  }
};
