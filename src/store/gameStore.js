import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useGameStore = create(
  persist(
    (set, get) => ({
      // Migration function to ensure new themes are added
      _migrate: () => {
        const state = get();
        const hasGlassmorphism = state.themes?.some(t => t.id === 'glassmorphism');
        
        if (!hasGlassmorphism) {
          set((state) => ({
            themes: [
              ...state.themes,
              { id: 'glassmorphism', name: 'Glassmorphism', price: 1200, owned: true, colors: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 182, 193, 0.1)', 'rgba(173, 216, 230, 0.1)', 'rgba(255, 255, 224, 0.08)', 'rgba(221, 160, 221, 0.1)', 'rgba(152, 251, 152, 0.08)', 'rgba(181, 91, 12, 0.1)'] }
            ]
          }));
        }
      },
      // Game state
      score: 0,
      level: 1,
      lines: 0,
      credits: 1000,
      highScore: 0,
      isPaused: false,
      isGameOver: false,
      gameSpeed: 1000,
      levelChanged: false,
      gameStartTime: null,
      totalPlayTime: 0,
      
      // Combo system
      currentCombo: 0,
      maxCombo: 0,
      
      // Settings
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        soundVolume: 0.7,
        musicVolume: 0.5,
        particleEffects: true,
        screenShake: true,
        ghostPiece: true,
        gridLines: true,
        theme: 'neon',
        // Professional input settings (DAS/ARR)
        das: 100,  // Delayed Auto Shift in milliseconds
        arr: 0,    // Auto Repeat Rate in milliseconds (0 = instant)
        sdf: 1,    // Soft Drop Factor
        // Key bindings
        keyBindings: {
          moveLeft: 'ArrowLeft',
          moveRight: 'ArrowRight',
          softDrop: 'ArrowDown',
          hardDrop: ' ',
          rotate: 'ArrowUp',
          hold: 'c',
          pause: 'p'
        }
      },
      
      // Shop items
      themes: [
        { id: 'neon', name: 'Neon', price: 0, owned: true, colors: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800', '#ff0044', '#8800ff'] },
        { id: 'retro', name: 'Retro', price: 500, owned: false, colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c'] },
        { id: 'galaxy', name: 'Galaxy', price: 1000, owned: false, colors: ['#9b59b6', '#3498db', '#e74c3c', '#f39c12', '#1abc9c', '#34495e', '#e67e22'] },
        { id: 'cyberpunk', name: 'Cyberpunk', price: 1500, owned: false, colors: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff', '#06ffa5', '#ff4365'] },
        { id: 'pastel', name: 'Pastel', price: 750, owned: false, colors: ['#ffd3e1', '#c9f0ff', '#fff5ba', '#e4c1f9', '#a8e6cf', '#ffd3b6', '#ffaaa5'] },
        { id: 'glassmorphism', name: 'Glassmorphism', price: 1200, owned: true, colors: ['rgba(255, 255, 255, 0.45)', 'rgba(255, 182, 193, 0.5)', 'rgba(173, 216, 230, 0.5)', 'rgba(255, 255, 224, 0.45)', 'rgba(221, 160, 221, 0.5)', 'rgba(152, 251, 152, 0.45)', 'rgba(255, 218, 185, 0.5)'] },
      ],
      
      effects: [
        { id: 'none', name: 'Aucun', price: 0, owned: true },
        { id: 'rainbow', name: 'Arc-en-ciel', price: 800, owned: false },
        { id: 'fire', name: 'Feu', price: 1200, owned: false },
        { id: 'ice', name: 'Glace', price: 1200, owned: false },
        { id: 'electric', name: 'Électrique', price: 1500, owned: false },
        { id: 'matrix', name: 'Matrix', price: 2000, owned: false },
      ],

      currentTheme: 'neon',
      currentEffect: 'none',
      
      // Statistics
      statistics: {
        totalGamesPlayed: 0,
        totalLinesCleared: 0,
        totalScore: 0,
        totalPlayTime: 0,
        bestCombo: 0,
        perfectClears: 0,
      },
      
      // Actions
      updateScore: (points) => set((state) => ({
        score: state.score + points,
        credits: state.credits + Math.floor(points / 10),
        highScore: Math.max(state.highScore, state.score + points),
      })),
      
      updateLevel: () => set((state) => {
        const newLevel = Math.floor(state.lines / 10) + 1;
        const levelChanged = newLevel !== state.level;
        
        // Calcul de la vitesse avec une progression plus fluide
        // Niveau 1: 1000ms, Niveau 2: 900ms, etc. jusqu'à 100ms minimum
        const newGameSpeed = Math.max(50, 1000 - ((newLevel - 1) * 80));
        
        return {
          level: newLevel,
          gameSpeed: newGameSpeed,
          levelChanged: levelChanged, // Pour déclencher des animations
        };
      }),
      
      // Nouvelle fonction pour obtenir les lignes nécessaires pour le prochain niveau
      getLinesForNextLevel: () => {
        const state = get();
        const currentLevel = state.level;
        const linesForNextLevel = currentLevel * 10;
        const remainingLines = linesForNextLevel - state.lines;
        return Math.max(0, remainingLines);
      },
      
      // Fonction pour obtenir le pourcentage de progression vers le prochain niveau
      getLevelProgress: () => {
        const state = get();
        const currentLevel = state.level;
        const linesAtStartOfLevel = (currentLevel - 1) * 10;
        const linesForThisLevel = 10;
        const progressInLevel = state.lines - linesAtStartOfLevel;
        return Math.min(100, (progressInLevel / linesForThisLevel) * 100);
      },
      
      updateLines: (clearedLines) => set((state) => ({
        lines: state.lines + clearedLines,
        statistics: {
          ...state.statistics,
          totalLinesCleared: state.statistics.totalLinesCleared + clearedLines,
        },
      })),
      
      setPaused: (paused) => set({ isPaused: paused }),
      
      setGameOver: (gameOver) => set((state) => {
        if (gameOver && state.gameStartTime) {
          const playTime = Math.floor((Date.now() - state.gameStartTime) / 1000);
          return {
            isGameOver: gameOver,
            totalPlayTime: playTime,
            statistics: {
              ...state.statistics,
              totalGamesPlayed: state.statistics.totalGamesPlayed + 1,
              totalScore: state.statistics.totalScore + state.score,
              totalPlayTime: state.statistics.totalPlayTime + playTime,
            },
          };
        }
        return { isGameOver: gameOver };
      }),
      
      resetGame: () => set({
        score: 0,
        level: 1,
        lines: 0,
        isPaused: false,
        isGameOver: false,
        gameSpeed: 1000,
        currentCombo: 0,
        maxCombo: 0,
        levelChanged: false,
        gameStartTime: Date.now(),
        totalPlayTime: 0,
      }),
      
      // Combo actions
      incrementCombo: () => set((state) => ({
        currentCombo: state.currentCombo + 1,
        maxCombo: Math.max(state.maxCombo, state.currentCombo + 1),
        statistics: {
          ...state.statistics,
          bestCombo: Math.max(state.statistics.bestCombo, state.currentCombo + 1),
        },
      })),
      
      resetCombo: () => set({ currentCombo: 0 }),
      
      updateSettings: (newSettings) => set((state) => {
        const updatedSettings = { ...state.settings, ...newSettings };
        
        // Import soundManager dynamically to avoid circular imports
        import('../utils/soundManager.js').then(({ default: soundManager }) => {
          soundManager.updateSettings(updatedSettings);
        });
        
        return {
          settings: updatedSettings,
        };
      }),
      
      purchaseTheme: (themeId) => set((state) => {
        const theme = state.themes.find(t => t.id === themeId);
        if (!theme || theme.owned || state.credits < theme.price) return state;
        
        return {
          credits: state.credits - theme.price,
          themes: state.themes.map(t => 
            t.id === themeId ? { ...t, owned: true } : t
          ),
        };
      }),
      
      purchaseEffect: (effectId) => set((state) => {
        const effect = state.effects.find(e => e.id === effectId);
        if (!effect || effect.owned || state.credits < effect.price) return state;
        
        return {
          credits: state.credits - effect.price,
          effects: state.effects.map(e => 
            e.id === effectId ? { ...e, owned: true } : e
          ),
        };
      }),

      
      setCurrentTheme: (themeId) => set((state) => {
        const theme = state.themes.find(t => t.id === themeId);
        if (!theme || !theme.owned) return state;
        return { currentTheme: themeId };
      }),
      
      setCurrentEffect: (effectId) => set((state) => {
        const effect = state.effects.find(e => e.id === effectId);
        if (!effect || !effect.owned) return state;
        return { currentEffect: effectId };
      }),

      
      addCredits: (amount) => set((state) => ({
        credits: state.credits + amount,
      })),
    }),
    {
      name: 'tetris-game-storage',
      partialize: (state) => ({
        highScore: state.highScore,
        credits: state.credits,
        settings: state.settings,
        themes: state.themes,
        effects: state.effects,
        currentTheme: state.currentTheme,
        currentEffect: state.currentEffect,
        statistics: state.statistics,
      }),
    }
  )
);

export default useGameStore;
