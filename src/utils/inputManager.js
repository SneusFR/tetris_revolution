/**
 * Professional Input Manager with DAS/ARR support
 * Similar to Jstris input handling
 */

class InputManager {
  constructor() {
    // Input state
    this.keys = {
      left: false,
      right: false,
      down: false,
      up: false,
      space: false,
      hold: false,
      pause: false
    };

    // DAS/ARR settings (in milliseconds)
    this.settings = {
      das: 500,  // Delayed Auto Shift - delay before auto-repeat starts (500ms delay - much slower)
      arr: 150,  // Auto Repeat Rate - delay between repeats (150ms = ~6.7 moves/second - much slower)
      sdf: 1,    // Soft Drop Factor - multiplier for down key
      keyBindings: {
        moveLeft: 'ArrowLeft',
        moveRight: 'ArrowRight',
        softDrop: 'ArrowDown',
        hardDrop: ' ',
        rotate: 'ArrowUp',
        hold: 'c',
        pause: 'p'
      }
    };

    // Timing state
    this.timers = {
      left: { dasStart: 0, lastRepeat: 0, active: false, lastPress: 0 },
      right: { dasStart: 0, lastRepeat: 0, active: false, lastPress: 0 },
      down: { dasStart: 0, lastRepeat: 0, active: false, lastPress: 0 }
    };

    // Debounce delay to prevent accidental double presses (in milliseconds)
    this.debounceDelay = 100; // 100ms to prevent accidental double presses

    // Callbacks
    this.callbacks = {
      moveLeft: null,
      moveRight: null,
      moveDown: null,
      rotate: null,
      hardDrop: null,
      hold: null,
      pause: null
    };

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.update = this.update.bind(this);

    // Animation frame for smooth input handling
    this.animationFrame = null;
    this.lastUpdateTime = 0;
  }

  /**
   * Initialize the input manager
   */
  init() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.startUpdateLoop();
  }

  /**
   * Cleanup the input manager
   */
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.stopUpdateLoop();
  }

  /**
   * Set callbacks for input actions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Update DAS/ARR settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Handle keydown events
   */
  handleKeyDown(e) {
    const now = performance.now();
    let handled = false;
    const key = e.key.toLowerCase();
    const bindings = this.settings.keyBindings;

    // Check for move left
    if (key === bindings.moveLeft.toLowerCase()) {
      if (!this.keys.left && (now - this.timers.left.lastPress) > this.debounceDelay) {
        this.keys.left = true;
        this.timers.left.dasStart = now;
        this.timers.left.lastPress = now;
        // Set lastRepeat to future to prevent immediate repeat in update loop
        this.timers.left.lastRepeat = now + this.settings.das;
        this.timers.left.active = true;
        // Immediate first move
        if (this.callbacks.moveLeft) {
          this.callbacks.moveLeft();
        }
      }
      handled = true;
    }
    // Check for move right
    else if (key === bindings.moveRight.toLowerCase()) {
      if (!this.keys.right && (now - this.timers.right.lastPress) > this.debounceDelay) {
        this.keys.right = true;
        this.timers.right.dasStart = now;
        this.timers.right.lastPress = now;
        // Set lastRepeat to future to prevent immediate repeat in update loop
        this.timers.right.lastRepeat = now + this.settings.das;
        this.timers.right.active = true;
        // Immediate first move
        if (this.callbacks.moveRight) {
          this.callbacks.moveRight();
        }
      }
      handled = true;
    }
    // Check for soft drop
    else if (key === bindings.softDrop.toLowerCase()) {
      if (!this.keys.down && (now - this.timers.down.lastPress) > this.debounceDelay) {
        this.keys.down = true;
        this.timers.down.dasStart = now;
        this.timers.down.lastPress = now;
        // Set lastRepeat to future to prevent immediate repeat in update loop
        const softDropDAS = Math.max(this.settings.das / 2, 16);
        this.timers.down.lastRepeat = now + softDropDAS;
        this.timers.down.active = true;
        // Immediate first move
        if (this.callbacks.moveDown) {
          this.callbacks.moveDown();
        }
      }
      handled = true;
    }
    // Check for rotate
    else if (key === bindings.rotate.toLowerCase()) {
      if (!this.keys.up) {
        this.keys.up = true;
        // Rotation is immediate, no DAS/ARR
        if (this.callbacks.rotate) {
          this.callbacks.rotate();
        }
      }
      handled = true;
    }
    // Check for hard drop
    else if (key === bindings.hardDrop.toLowerCase() || (bindings.hardDrop === ' ' && e.key === ' ')) {
      if (!this.keys.space) {
        this.keys.space = true;
        // Hard drop is immediate, no DAS/ARR
        if (this.callbacks.hardDrop) {
          this.callbacks.hardDrop();
        }
      }
      handled = true;
    }
    // Check for hold
    else if (key === bindings.hold.toLowerCase()) {
      if (!this.keys.hold) {
        this.keys.hold = true;
        // Hold is immediate, no DAS/ARR
        if (this.callbacks.hold) {
          this.callbacks.hold();
        }
      }
      handled = true;
    }
    // Check for pause
    else if (key === bindings.pause.toLowerCase()) {
      if (!this.keys.pause) {
        this.keys.pause = true;
        // Pause is immediate, no DAS/ARR
        if (this.callbacks.pause) {
          this.callbacks.pause();
        }
      }
      handled = true;
    }

    if (handled) {
      e.preventDefault();
    }
  }

  /**
   * Handle keyup events
   */
  handleKeyUp(e) {
    let handled = false;
    const key = e.key.toLowerCase();
    const bindings = this.settings.keyBindings;

    // Check for move left
    if (key === bindings.moveLeft.toLowerCase()) {
      this.keys.left = false;
      this.timers.left.active = false;
      handled = true;
    }
    // Check for move right
    else if (key === bindings.moveRight.toLowerCase()) {
      this.keys.right = false;
      this.timers.right.active = false;
      handled = true;
    }
    // Check for soft drop
    else if (key === bindings.softDrop.toLowerCase()) {
      this.keys.down = false;
      this.timers.down.active = false;
      handled = true;
    }
    // Check for rotate
    else if (key === bindings.rotate.toLowerCase()) {
      this.keys.up = false;
      handled = true;
    }
    // Check for hard drop
    else if (key === bindings.hardDrop.toLowerCase() || (bindings.hardDrop === ' ' && e.key === ' ')) {
      this.keys.space = false;
      handled = true;
    }
    // Check for hold
    else if (key === bindings.hold.toLowerCase()) {
      this.keys.hold = false;
      handled = true;
    }
    // Check for pause
    else if (key === bindings.pause.toLowerCase()) {
      this.keys.pause = false;
      handled = true;
    }

    if (handled) {
      e.preventDefault();
    }
  }

  /**
   * Start the update loop
   */
  startUpdateLoop() {
    const updateLoop = (currentTime) => {
      this.update(currentTime);
      this.animationFrame = requestAnimationFrame(updateLoop);
    };
    this.animationFrame = requestAnimationFrame(updateLoop);
  }

  /**
   * Stop the update loop
   */
  stopUpdateLoop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Update DAS/ARR logic - called every frame
   */
  update(currentTime) {
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Process left movement
    if (this.timers.left.active && this.keys.left) {
      const elapsed = currentTime - this.timers.left.dasStart;
      if (elapsed >= this.settings.das) {
        const timeSinceLastRepeat = currentTime - this.timers.left.lastRepeat;
        if (timeSinceLastRepeat >= this.settings.arr) {
          if (this.callbacks.moveLeft) {
            this.callbacks.moveLeft();
          }
          this.timers.left.lastRepeat = currentTime;
        }
      }
    }

    // Process right movement
    if (this.timers.right.active && this.keys.right) {
      const elapsed = currentTime - this.timers.right.dasStart;
      if (elapsed >= this.settings.das) {
        const timeSinceLastRepeat = currentTime - this.timers.right.lastRepeat;
        if (timeSinceLastRepeat >= this.settings.arr) {
          if (this.callbacks.moveRight) {
            this.callbacks.moveRight();
          }
          this.timers.right.lastRepeat = currentTime;
        }
      }
    }

    // Process down movement (soft drop)
    if (this.timers.down.active && this.keys.down) {
      const elapsed = currentTime - this.timers.down.dasStart;
      // Soft drop has different timing - usually faster
      const softDropDAS = Math.max(this.settings.das / 2, 16); // At least 16ms
      const softDropARR = Math.max(this.settings.arr, 16); // At least 16ms
      
      if (elapsed >= softDropDAS) {
        const timeSinceLastRepeat = currentTime - this.timers.down.lastRepeat;
        if (timeSinceLastRepeat >= softDropARR) {
          if (this.callbacks.moveDown) {
            this.callbacks.moveDown();
          }
          this.timers.down.lastRepeat = currentTime;
        }
      }
    }
  }

  /**
   * Get current input state (for debugging)
   */
  getState() {
    return {
      keys: { ...this.keys },
      timers: { ...this.timers },
      settings: { ...this.settings }
    };
  }
}

// Create singleton instance
const inputManager = new InputManager();

export default inputManager;
