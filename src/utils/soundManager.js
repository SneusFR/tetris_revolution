import { Howl, Howler } from 'howler';
import tetrisMusic from '../assets/tetris.mp3';
import rotationSound from '../assets/RotationGood.mp3';
import moveSound from '../assets/move.mp3';
import placingSound from '../assets/placing.mp3';

class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.initialized = false;
    this.currentSettings = {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.7,
      musicVolume: 0.5
    };
  }

  init() {
    if (this.initialized) return;

    // Create sound effects using Howl for better control
    this.sounds = {
      move: new Howl({
        src: [moveSound],
        volume: 0.7,
        preload: true
      }),
      rotate: new Howl({
        src: [rotationSound],
        volume: 0.7,
        preload: true
      }),
      drop: new Howl({
        src: [placingSound],
        volume: 0.7,
        preload: true
      }),
      clear: this.createBeep(500, 0.2),
      tetris: this.createBeep(800, 0.3),
      gameOver: this.createBeep(100, 0.5),
      levelUp: this.createBeep(600, 0.3),
      coin: this.createBeep(700, 0.15),
    };

    // Background music
    this.music = new Howl({
      src: [tetrisMusic],
      loop: true,
      volume: 0.5,
      preload: true
    });
    
    this.initialized = true;
  }

  createBeep(frequency, duration) {
    // Create a simple beep sound using oscillator
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    return {
      play: (volume = 1) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      },
      volume: (vol) => {
        // For oscillator sounds, we'll store the volume for next play
        this._volume = vol;
      }
    };
  }

  playSound(soundName, settings = {}) {
    if (!this.initialized) this.init();
    
    if (settings.soundEnabled && this.sounds[soundName]) {
      const sound = this.sounds[soundName];
      const volume = settings.soundVolume || 1;
      
      if (sound.volume && typeof sound.volume === 'function') {
        // For Howl sounds
        sound.volume(volume);
        sound.play();
      } else {
        // For oscillator sounds
        sound.play(volume);
      }
    }
  }

  playMusic(settings = {}) {
    if (!this.initialized) this.init();
    
    if (settings.musicEnabled && this.music) {
      this.music.volume(settings.musicVolume || 0.5);
      if (!this.music.playing()) {
        this.music.play();
      }
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.stop();
    }
  }

  setMusicVolume(volume) {
    if (this.music) {
      this.music.volume(volume);
    }
  }

  setSoundVolume(volume) {
    // Update volume for all Howl sounds
    Object.keys(this.sounds).forEach(key => {
      const sound = this.sounds[key];
      if (sound.volume && typeof sound.volume === 'function') {
        sound.volume(volume);
      }
    });
  }

  // Method to update settings and apply volume changes immediately
  updateSettings(newSettings) {
    this.currentSettings = { ...this.currentSettings, ...newSettings };
    
    // Apply volume changes immediately
    if (newSettings.musicVolume !== undefined) {
      this.setMusicVolume(newSettings.musicVolume);
    }
    
    if (newSettings.soundVolume !== undefined) {
      this.setSoundVolume(newSettings.soundVolume);
    }
    
    // Handle music enable/disable
    if (newSettings.musicEnabled !== undefined) {
      if (newSettings.musicEnabled) {
        this.playMusic(this.currentSettings);
      } else {
        this.stopMusic();
      }
    }
  }
}

export default new SoundManager();
