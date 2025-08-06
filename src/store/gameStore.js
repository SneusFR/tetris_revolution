import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useGameStore = create(
  persist(
    (set, get) => ({
      // Game state
      score: 0,
      level: 1,
      lines: 0,
      credits: 1000,
      highScore: 0,
      isPaused: false,
      isGameOver: false,
      gameSpeed: 1000,
      
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
      },
      
      // Shop items
      themes: [
        { id: 'neon', name: 'Neon', price: 0, owned: true, colors: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800', '#ff0044', '#8800ff'] },
        { id: 'retro', name: 'Retro', price: 500, owned: false, colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c'] },
        { id: 'galaxy', name: 'Galaxy', price: 1000, owned: false, colors: ['#9b59b6', '#3498db', '#e74c3c', '#f39c12', '#1abc9c', '#34495e', '#e67e22'] },
        { id: 'cyberpunk', name: 'Cyberpunk', price: 1500, owned: false, colors: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff', '#06ffa5', '#ff4365'] },
        { id: 'pastel', name: 'Pastel', price: 750, owned: false, colors: ['#ffd3e1', '#c9f0ff', '#fff5ba', '#e4c1f9', '#a8e6cf', '#ffd3b6', '#ffaaa5'] },
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
      
      updateLevel: () => set((state) => ({
        level: Math.floor(state.lines / 10) + 1,
        gameSpeed: Math.max(100, 1000 - (Math.floor(state.lines / 10) * 100)),
      })),
      
      updateLines: (clearedLines) => set((state) => ({
        lines: state.lines + clearedLines,
        statistics: {
          ...state.statistics,
          totalLinesCleared: state.statistics.totalLinesCleared + clearedLines,
        },
      })),
      
      setPaused: (paused) => set({ isPaused: paused }),
      
      setGameOver: (gameOver) => set((state) => ({
        isGameOver: gameOver,
        statistics: gameOver ? {
          ...state.statistics,
          totalGamesPlayed: state.statistics.totalGamesPlayed + 1,
          totalScore: state.statistics.totalScore + state.score,
        } : state.statistics,
      })),
      
      resetGame: () => set({
        score: 0,
        level: 1,
        lines: 0,
        isPaused: false,
        isGameOver: false,
        gameSpeed: 1000,
      }),
      
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
