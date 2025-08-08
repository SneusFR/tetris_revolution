import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import useAuthStore from '../store/authStore';
import useEffectStore from '../store/effectStore';
import useThemeStore from '../store/themeStore';
import soundManager from '../utils/soundManager';
import inputManager from '../utils/inputManager';
import VisualEffects from './VisualEffects';
import ParticleEffects from './ParticleEffects';
import ScreenShake from './ScreenShake';
import ScoreImpact from './ScoreImpact';
import LevelDisplay from './LevelDisplay';
import {
  createBoard,
  isValidPosition,
  mergePiece,
  clearLines,
  calculateScore,
  calculateComboBonus,
  getGhostPieceY,
  isGameOver,
  tryRotate,
  generateBag,
  getLinesToClear,
  wouldLockAboveTop,
  BOARD_WIDTH,
  BOARD_HEIGHT
} from '../utils/tetrisLogic';

const TetrisGame = () => {
  const [board, setBoard] = useState(createBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPieces, setNextPieces] = useState([]);
  const [bag, setBag] = useState([]);
  const [holdPiece, setHoldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [dropTime, setDropTime] = useState(null);
  const [lastLinesCleared, setLastLinesCleared] = useState(0);
  const [linesClearPosition, setLinesClearPosition] = useState(null);
  const [isHardDropping, setIsHardDropping] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState([]);
  const [disappearingLines, setDisappearingLines] = useState([]);
  const [isAnimatingLines, setIsAnimatingLines] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [scoreImpactKey, setScoreImpactKey] = useState(0);
  const [scoreImpactData, setScoreImpactData] = useState(null);
  const [activeEffect, setActiveEffect] = useState('none'); // État local pour l'effet actif
  const gameLoopRef = useRef();
  const boardRef = useRef();
  const scoreRef = useRef();
  
  // Lock delay system refs
  const contactRef = useRef(false);
  const lockStartRef = useRef(0);
  const lockResetsRef = useRef(0);

  const LOCK_DELAY_MS = 500;      // 500ms lock delay
  const MAX_LOCK_RESETS = 15;     // Maximum lock resets

  const {
    score,
    level,
    lines,
    isPaused,
    isGameOver: gameOver,
    gameSpeed,
    settings,
    themes,
    currentTheme,
    currentCombo,
    maxCombo,
    totalPlayTime,
    updateScore,
    updateLevel,
    updateLines,
    setPaused,
    setGameOver,
    resetGame,
    incrementCombo,
    resetCombo,
    setCurrentEffect: setGameStoreEffect
  } = useGameStore();

  const { isAuthenticated, user, saveGameResult } = useAuthStore();
  const { fetchEffects, currentEffect: serverEffect } = useEffectStore();
  const { fetchThemes, currentTheme: serverTheme, themes: serverThemes } = useThemeStore();

  // Utiliser les thèmes du serveur si disponibles, sinon utiliser ceux du gameStore local
  // IMPORTANT: Utiliser le thème du serveur (serverTheme) si disponible, sinon currentTheme du gameStore
  const activeThemeId = serverTheme?.id || currentTheme;
  const availableThemes = serverThemes && serverThemes.length > 0 ? serverThemes : themes;
  const theme = availableThemes.find(t => t.id === activeThemeId);
  const colors = theme ? theme.colors : ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800', '#ff0044', '#8800ff'];
  
  // Refs for stable game loop
  const currentPieceRef = useRef(null);
  const boardStateRef = useRef(board);
  const lockPieceRef = useRef(() => {});
  const lastTimeRef = useRef(0);
  const accRef = useRef(0);
  const hueRef = useRef(0);
  
  // Update refs when state changes
  useEffect(() => { currentPieceRef.current = currentPiece; }, [currentPiece]);
  useEffect(() => { boardStateRef.current = board; }, [board]);
  
  // Update hue for rainbow effect every 100ms
  useEffect(() => {
    if (activeEffect === 'rainbow') {
      const interval = setInterval(() => {
        hueRef.current = (hueRef.current + 5) % 360;
      }, 100);
      return () => clearInterval(interval);
    }
  }, [activeEffect]);

  // Initialize game
  useEffect(() => {
    startNewGame();
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  // Synchroniser les effets au démarrage du jeu si l'utilisateur est authentifié
  useEffect(() => {
    const syncEffects = async () => {
      if (isAuthenticated && user) {
        // Utiliser l'effet du serveur (depuis les settings de l'utilisateur)
        const userEffect = user.settings?.visualEffect || 'none';
        setActiveEffect(userEffect);
        
        // Synchroniser avec le gameStore local
        setGameStoreEffect(userEffect);
        
        console.log('Effet synchronisé depuis le serveur:', userEffect);
      } else {
        // Si non authentifié, utiliser l'effet du gameStore local
        const localEffect = useGameStore.getState().currentEffect || 'none';
        setActiveEffect(localEffect);
        console.log('Effet local utilisé:', localEffect);
      }
    };
    
    syncEffects();
  }, [isAuthenticated, user?.settings?.visualEffect, setGameStoreEffect]);

  // Synchroniser quand l'effet du serveur change (après achat/sélection dans la boutique)
  useEffect(() => {
    if (serverEffect && serverEffect.id && serverEffect.id !== activeEffect) {
      setActiveEffect(serverEffect.id);
      setGameStoreEffect(serverEffect.id);
      console.log('Effet mis à jour depuis la boutique:', serverEffect.id);
    }
  }, [serverEffect?.id, activeEffect, setGameStoreEffect]);

  // Synchroniser les thèmes au démarrage du jeu si l'utilisateur est authentifié
  useEffect(() => {
    const syncThemes = async () => {
      if (isAuthenticated && user) {
        // Récupérer les thèmes depuis le serveur pour s'assurer d'avoir les données les plus récentes
        await fetchThemes();
        
        // Utiliser le thème du serveur (depuis les settings de l'utilisateur)
        const userTheme = user.settings?.theme || 'neon';
        
        // Synchroniser avec le gameStore local
        const { setCurrentTheme } = useGameStore.getState();
        setCurrentTheme(userTheme);
        
        console.log('Thème synchronisé depuis le serveur:', userTheme);
      } else {
        // Si non authentifié, utiliser le thème du gameStore local
        const localTheme = useGameStore.getState().currentTheme || 'neon';
        console.log('Thème local utilisé:', localTheme);
      }
    };
    
    syncThemes();
  }, [isAuthenticated, user?.settings?.theme, fetchThemes]);

  // Synchroniser quand le thème du serveur change (après achat/sélection dans la boutique)
  useEffect(() => {
    if (serverTheme && serverTheme.id && serverTheme.id !== currentTheme) {
      const { setCurrentTheme } = useGameStore.getState();
      setCurrentTheme(serverTheme.id);
      console.log('Thème mis à jour depuis la boutique:', serverTheme.id);
    }
  }, [serverTheme?.id, currentTheme]);

  // Save game result when game is over
  useEffect(() => {
    if (gameOver && isAuthenticated && score > 0) {
      const gameData = {
        score,
        level,
        linesCleared: lines,
        timePlayed: totalPlayTime, // Temps de jeu réel en secondes
        gameMode: 'classic',
        difficulty: 'normal'
      };
      
      saveGameResult(gameData);
    }
  }, [gameOver, isAuthenticated, score, level, lines, totalPlayTime, saveGameResult]);

  // Optimized game loop with requestAnimationFrame limited to 60 FPS
  useEffect(() => {
    if (isPaused || gameOver || isHardDropping || isAnimatingLines) return;

    const step = gameSpeed; // en ms/ligne
    const targetFPS = 60;
    const frameTime = 1000 / targetFPS; // 16.67ms for 60 FPS
    let raf;
    let lastFrameTime = 0;

    const loop = (t) => {
      // Limit to 60 FPS
      if (!lastFrameTime) lastFrameTime = t;
      const deltaFrame = t - lastFrameTime;
      
      // Only process if enough time has passed for target FPS
      if (deltaFrame >= frameTime) {
        // Calculate actual dt for game logic (capped at frameTime)
        const dt = Math.min(deltaFrame, frameTime * 2); // Cap at 2 frames to prevent huge jumps
        
        accRef.current += dt;
        while (accRef.current >= step) {
          const piece = currentPieceRef.current;
          if (!piece) break;
          if (isValidPosition(boardStateRef.current, piece, piece.x, piece.y + 1)) {
            setCurrentPiece(p => p ? { ...p, y: p.y + 1 } : p);
            // Quitte le sol => on annule l'état de contact
            contactRef.current = false;
          } else {
            // La pièce ne peut plus descendre - gérer le lock delay
            if (!contactRef.current) {
              contactRef.current = true;
              lockStartRef.current = performance.now();
              lockResetsRef.current = 0;
            }
            const elapsed = performance.now() - lockStartRef.current;
            if (elapsed >= LOCK_DELAY_MS) {
              lockPieceRef.current();
              contactRef.current = false;
            }
          }
          accRef.current -= step;
        }
        
        // Update last frame time, accounting for the frame time to maintain consistent 60 FPS
        lastFrameTime = t - (deltaFrame % frameTime);
      }
      
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => { 
      cancelAnimationFrame(raf); 
      lastTimeRef.current = 0; 
      accRef.current = 0; 
    };
  }, [isPaused, gameOver, gameSpeed, isHardDropping, isAnimatingLines]);

  const startNewGame = () => {
    resetGame();
    setBoard(createBoard());
    
    // Generate initial bags
    let initialBag = generateBag();
    const secondBag = generateBag();
    initialBag = [...initialBag, ...secondBag];
    
    // Set the first piece as current
    setCurrentPiece(initialBag[0]);
    
    // Set the next 3 pieces for preview
    setNextPieces(initialBag.slice(1, 4));
    
    // Store the remaining pieces in the bag
    setBag(initialBag.slice(1));
    
    setHoldPiece(null);
    setCanHold(true);
    
    if (settings.musicEnabled) {
      soundManager.playMusic(settings);
    }
  };

  const getNewPiece = useCallback(() => {
    let currentBag = bag;
    
    // Ensure we always have enough pieces
    while (currentBag.length < 7) {
      const newBag = generateBag();
      currentBag = [...currentBag, ...newBag];
    }
    
    // Take the first piece as the new current piece
    const newPiece = currentBag[0];
    const remainingBag = currentBag.slice(1);
    
    // Update next pieces preview (show the next 3 pieces)
    setNextPieces(remainingBag.slice(0, 3));
    
    // Save the remaining bag (excluding the piece we took and the 3 in preview)
    setBag(remainingBag);
    
    return newPiece;
  }, [bag]);

  const moveDown = useCallback(() => {
    if (!currentPiece) return;

    if (isValidPosition(board, currentPiece, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece({
        ...currentPiece,
        y: currentPiece.y + 1
      });
    } else {
      lockPiece();
    }
  }, [currentPiece, board]);

  const lockPiece = useCallback(() => {
    const piece = currentPieceRef.current;
    const b = boardStateRef.current;
    if (!piece || isAnimatingLines) return;

    // Sécurité: vérifier si la pièce se verrouille au-dessus du board
    if (wouldLockAboveTop(piece)) {
      setGameOver(true);
      soundManager.stopMusic();
      soundManager.playSound('gameOver', settings);
      return;
    }

    const newBoard = mergePiece(b, piece);
    if (!newBoard) {
      // collision à la fusion -> on ne touche pas au board et on top-out proprement
      setGameOver(true);
      soundManager.stopMusic();
      soundManager.playSound('gameOver', settings);
      return;
    }
    const linesToClear = getLinesToClear(newBoard);
    
    if (linesToClear.length > 0) {
      // Instead of clearing the current piece immediately, we'll update the board
      // but keep the current piece visible (it will be filtered during rendering)
      setBoard(newBoard);
      
      // Start line clearing animation
      setIsAnimatingLines(true);
      
      // Phase 1: Highlight lines
      setHighlightedLines(linesToClear);
      
      setTimeout(() => {
        // Phase 2: Start disappearing animation
        setDisappearingLines(linesToClear);
        setHighlightedLines([]);
        
        setTimeout(() => {
          // Phase 3: Actually clear the lines and update the board
          const { board: clearedBoard, linesCleared } = clearLines(newBoard);
          setBoard(clearedBoard);
          setDisappearingLines([]);
          setIsAnimatingLines(false);
          
          // Now clear the current piece after the animation
          setCurrentPiece(null);
          
          // Handle combo system
          incrementCombo();
          const comboBonus = calculateComboBonus(currentCombo + 1, level);
          
          // Update game state
          const points = calculateScore(linesCleared, level);
          const totalPoints = points + comboBonus;
          const previousScore = score;
          updateScore(totalPoints);
          updateLines(linesCleared);
          updateLevel();
          
          // Set particle effect data
          setLastLinesCleared(linesCleared);
          setLinesClearPosition({
            x: BOARD_WIDTH * 15, // Center of board
            y: BOARD_HEIGHT * 15 // Center of board
          });
          
          // Trigger screen shake based on lines cleared
          if (settings.screenShake) {
            setShakeIntensity(linesCleared);
            setTimeout(() => setShakeIntensity(0), 500 + (linesCleared * 100));
          }
          
          // Trigger score impact effect with unique key
          setScoreImpactData({
            score: previousScore + totalPoints,
            linesCleared: linesCleared,
            scoreChange: totalPoints,
            comboCount: currentCombo + 1,
            comboBonus: comboBonus
          });
          setScoreImpactKey(prev => prev + 1);
          
          soundManager.playSound(linesCleared === 4 ? 'tetris' : 'clear', settings);
          
          // Reset particle effect after delay
          setTimeout(() => {
            setLastLinesCleared(0);
            setLinesClearPosition(null);
          }, 2500);
          
          // Get new piece and check game over
          const newPiece = getNewPiece();
          
          if (isGameOver(clearedBoard, newPiece)) {
            setGameOver(true);
            soundManager.stopMusic();
            soundManager.playSound('gameOver', settings);
            return;
          }
          
          setCurrentPiece(newPiece);
          setCanHold(true);
        }, 125); // Duration of disappear animation (2x faster)
      }, 75); // Duration of highlight animation (2x faster)
    } else {
      // No lines to clear, reset combo
      resetCombo();
      setBoard(newBoard);
      
      const newPiece = getNewPiece();
      
      if (isGameOver(newBoard, newPiece)) {
        setGameOver(true);
        soundManager.stopMusic();
        soundManager.playSound('gameOver', settings);
        return;
      }
      
      setCurrentPiece(newPiece);
      setCanHold(true);
    }
  }, [currentPiece, board, level, settings, isAnimatingLines, getNewPiece, updateScore, updateLines, updateLevel, setGameOver]);

  // Update lockPiece ref after function definition
  useEffect(() => { lockPieceRef.current = lockPiece; }, [lockPiece]);

  const moveLeft = useCallback(() => {
    const piece = currentPieceRef.current;
    const b = boardStateRef.current;
    if (!piece || isPaused || gameOver) return;

    if (isValidPosition(b, piece, piece.x - 1, piece.y)) {
      setCurrentPiece(p => p ? { ...p, x: p.x - 1 } : p);
      soundManager.playSound('move', settings);
      if (contactRef.current && lockResetsRef.current < MAX_LOCK_RESETS) {
        lockStartRef.current = performance.now();
        lockResetsRef.current += 1;
      }
    }
  }, [isPaused, gameOver, settings]);

  const moveRight = useCallback(() => {
    const piece = currentPieceRef.current;
    const b = boardStateRef.current;
    if (!piece || isPaused || gameOver) return;

    if (isValidPosition(b, piece, piece.x + 1, piece.y)) {
      setCurrentPiece(p => p ? { ...p, x: p.x + 1 } : p);
      soundManager.playSound('move', settings);
      if (contactRef.current && lockResetsRef.current < MAX_LOCK_RESETS) {
        lockStartRef.current = performance.now();
        lockResetsRef.current += 1;
      }
    }
  }, [isPaused, gameOver, settings]);

  const rotate = useCallback(() => {
    const piece = currentPieceRef.current;
    const b = boardStateRef.current;
    if (!piece || isPaused || gameOver) return;

    const rotated = tryRotate(b, piece);
    if (rotated && isValidPosition(b, rotated, rotated.x, rotated.y)) {
      setCurrentPiece(rotated);
      soundManager.playSound('rotate', settings);
      if (contactRef.current && lockResetsRef.current < MAX_LOCK_RESETS) {
        lockStartRef.current = performance.now();
        lockResetsRef.current += 1;
      }
    }
  }, [isPaused, gameOver, settings]);

  const hardDrop = useCallback(() => {
    const piece = currentPieceRef.current;
    const b = boardStateRef.current;
    if (!piece || isPaused || gameOver || isHardDropping || isAnimatingLines) return;

    const gy = getGhostPieceY(b, piece);
    if (gy == null) { lockPieceRef.current(); return; }

    const dropDistance = gy - piece.y;
    
    // Set hard dropping state to prevent game loop interference
    setIsHardDropping(true);
    
    // Create the dropped piece with the new position
    const droppedPiece = {
      ...piece,
      y: gy
    };
    
    // Sécurité: vérifier si la pièce se verrouille au-dessus du board
    if (wouldLockAboveTop(droppedPiece)) {
      setGameOver(true);
      soundManager.stopMusic();
      soundManager.playSound('gameOver', settings);
      setIsHardDropping(false);
      return;
    }
    
    // Update score for the drop distance
    updateScore(dropDistance * 2);
    soundManager.playSound('drop', settings);
    
    // Immediately lock the piece at the correct position
    const newBoard = mergePiece(b, droppedPiece);
    const linesToClear = getLinesToClear(newBoard);
    
    if (linesToClear.length > 0) {
      // Instead of clearing the current piece immediately, we'll update the board
      // but keep the current piece visible (it will be filtered during rendering)
      setBoard(newBoard);
      
      // Start line clearing animation
      setIsAnimatingLines(true);
      
      // Phase 1: Highlight lines
      setHighlightedLines(linesToClear);
      
      setTimeout(() => {
        // Phase 2: Start disappearing animation
        setDisappearingLines(linesToClear);
        setHighlightedLines([]);
        
        setTimeout(() => {
          // Phase 3: Actually clear the lines and update the board
          const { board: clearedBoard, linesCleared } = clearLines(newBoard);
          setBoard(clearedBoard);
          setDisappearingLines([]);
          setIsAnimatingLines(false);
          setIsHardDropping(false);
          
          // Now clear the current piece after the animation
          setCurrentPiece(null);
          
          // Handle combo system
          incrementCombo();
          const comboBonus = calculateComboBonus(currentCombo + 1, level);
          
          // Update game state
          const points = calculateScore(linesCleared, level);
          const totalPoints = points + comboBonus;
          const previousScore = score;
          updateScore(totalPoints);
          updateLines(linesCleared);
          updateLevel();
          
          // Set particle effect data
          setLastLinesCleared(linesCleared);
          setLinesClearPosition({
            x: BOARD_WIDTH * 15, // Center of board
            y: BOARD_HEIGHT * 15 // Center of board
          });
          
          // Trigger screen shake based on lines cleared
          if (settings.screenShake) {
            setShakeIntensity(linesCleared);
            setTimeout(() => setShakeIntensity(0), 500 + (linesCleared * 100));
          }
          
          // Trigger score impact effect with unique key
          setScoreImpactData({
            score: previousScore + totalPoints,
            linesCleared: linesCleared,
            scoreChange: totalPoints,
            comboCount: currentCombo + 1,
            comboBonus: comboBonus
          });
          setScoreImpactKey(prev => prev + 1);
          
          soundManager.playSound(linesCleared === 4 ? 'tetris' : 'clear', settings);
          
          // Reset particle effect after delay
          setTimeout(() => {
            setLastLinesCleared(0);
            setLinesClearPosition(null);
          }, 2500);
          
          // Get new piece and check game over
          const newPiece = getNewPiece();
          
          if (isGameOver(clearedBoard, newPiece)) {
            setGameOver(true);
            soundManager.stopMusic();
            soundManager.playSound('gameOver', settings);
            return;
          }
          
          setCurrentPiece(newPiece);
          setCanHold(true);
        }, 125); // Duration of disappear animation (2x faster)
      }, 75); // Duration of highlight animation (2x faster)
    } else {
      // No lines to clear, reset combo
      resetCombo();
      setBoard(newBoard);
      setIsHardDropping(false);
      
      const newPiece = getNewPiece();
      
      if (isGameOver(newBoard, newPiece)) {
        setGameOver(true);
        soundManager.stopMusic();
        soundManager.playSound('gameOver', settings);
        return;
      }
      
      setCurrentPiece(newPiece);
      setCanHold(true);
    }
  }, [currentPiece, board, isPaused, gameOver, isHardDropping, isAnimatingLines, settings, level, getNewPiece, updateScore, updateLines, updateLevel, setGameOver]);

  const hold = useCallback(() => {
    if (!currentPiece || !canHold || isPaused || gameOver) return;
    
    const temp = holdPiece;
    // Reset spawn position and rotation when putting piece in hold
    setHoldPiece({
      ...currentPiece,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2),
      y: 0,
      rotation: 0
    });
    
    if (temp) {
      // Reset spawn position and rotation when taking piece from hold
      setCurrentPiece({
        ...temp,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(temp.shape[0].length / 2),
        y: 0,
        rotation: 0
      });
    } else {
      const newPiece = getNewPiece();
      setCurrentPiece(newPiece);
    }
    
    setCanHold(false);
    soundManager.playSound('move', settings);
  }, [currentPiece, holdPiece, canHold, isPaused, gameOver, settings, getNewPiece]);

  // Professional Input Manager with DAS/ARR
  useEffect(() => {
    // Initialize input manager
    inputManager.init();
    
    // Update input manager settings from store including key bindings
    inputManager.updateSettings({
      das: settings.das,
      arr: settings.arr,
      sdf: settings.sdf,
      keyBindings: settings.keyBindings || {
        moveLeft: 'ArrowLeft',
        moveRight: 'ArrowRight',
        softDrop: 'ArrowDown',
        hardDrop: ' ',
        rotate: 'ArrowUp',
        hold: 'c',
        pause: 'p'
      }
    });
    
    // Set up callbacks for game actions
    inputManager.setCallbacks({
      moveLeft: moveLeft,
      moveRight: moveRight,
      moveDown: moveDown,
      rotate: rotate,
      hardDrop: hardDrop,
      hold: hold,
      pause: () => setPaused(!isPaused)
    });

    // Handle game over restart separately (not part of DAS/ARR system)
    const handleGameOverRestart = (e) => {
      if (gameOver && e.key === 'Enter') {
        e.preventDefault();
        startNewGame();
      }
    };

    window.addEventListener('keydown', handleGameOverRestart);

    return () => {
      inputManager.destroy();
      window.removeEventListener('keydown', handleGameOverRestart);
    };
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, hold, isPaused, gameOver, settings.das, settings.arr, settings.sdf, settings.keyBindings]);

  const renderCell = (value, x, y, isGhost = false, ghostColor = null) => {
    const isEmpty = value === 0 && !isGhost;
    const color = isGhost && ghostColor !== null && ghostColor !== undefined
      ? colors[ghostColor]
      : (isEmpty ? 'transparent' : colors[value - 1]);
    
    // Check if this cell is part of a line being animated
    const isHighlighted = highlightedLines.includes(y);
    const isDisappearing = disappearingLines.includes(y);
    
    // Special handling for glassmorphism theme
    const isGlassmorphism = activeThemeId === 'glassmorphism';
    
    if (isGhost && ghostColor !== null) {
      if (isGlassmorphism) {
        // Glassmorphism ghost piece - transparent with glass effect
        return (
          <div
            key={`${x}-${y}`}
            className="relative w-full h-full"
            style={{
              backgroundColor: color,
              border: '1px solid rgba(255, 255, 255, 0.4)',
              opacity: 0.4,
              backdropFilter: 'blur(5px)',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 1px 2px rgba(0, 0, 0, 0.1)
              `,
              borderRadius: '2px',
              boxSizing: 'border-box'
            }}
          >
            {/* Glass highlight effect for ghost */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
                borderRadius: '1px'
              }}
            />
          </div>
        );
      } else {
        // Ghost piece with clean outline that matches exactly the solid blocks
        return (
          <div
            key={`${x}-${y}`}
            className="relative w-full h-full"
            style={{
              backgroundColor: 'transparent',
              border: `2px solid ${color}`,
              opacity: 0.5,
              boxSizing: 'border-box'
            }}
          >
            {/* Subtle inner glow for better visibility */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundColor: `${color}20`,
                margin: '2px'
              }}
            />
          </div>
        );
      }
    }
    
    if (isGlassmorphism && !isEmpty) {
      // Glassmorphism style - transparent glass effect
      return (
        <div
          key={`${x}-${y}`}
          className={`
            relative w-full h-full
            ${settings.gridLines ? 'border border-white/10' : 'border-transparent'}
            ${isHighlighted ? 'line-highlight' : ''}
            ${isDisappearing ? 'line-disappear' : ''}
          `}
          style={{
            backgroundColor: color,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            boxShadow: `
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1),
              0 2px 4px rgba(0, 0, 0, 0.1)
            `,
            borderRadius: '2px'
          }}
        >
          {/* Glass highlight effect */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%)',
              borderRadius: '1px'
            }}
          />
          {/* Subtle inner border for glass effect */}
          <div 
            className="absolute inset-0"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1px',
              margin: '1px'
            }}
          />
        </div>
      );
    }
    
    return (
      <div
        key={`${x}-${y}`}
        className={`
          relative w-full h-full border
          ${isEmpty ? 'border-gray-800' : 'border-gray-900'}
          ${settings.gridLines ? 'border-gray-800/30' : 'border-transparent'}
          ${isHighlighted ? 'line-highlight' : ''}
          ${isDisappearing ? 'line-disappear' : ''}
        `}
        style={{
          backgroundColor: color,
          boxShadow: !isEmpty ? `inset 0 0 10px rgba(255,255,255,0.3)` : 'none'
        }}
      >
        {!isEmpty && !isGhost && activeEffect === 'rainbow' && (
          <div className="absolute inset-0 animate-pulse">
            <div 
              className="absolute inset-0 rounded-sm"
              style={{
                background: `linear-gradient(45deg, 
                  hsl(${(hueRef.current + x * 30 + y * 30) % 360}, 100%, 70%), 
                  hsl(${(hueRef.current + x * 30 + y * 30 + 60) % 360}, 100%, 70%))`,
                boxShadow: `0 0 15px hsl(${(hueRef.current + x * 30 + y * 30) % 360}, 100%, 70%)`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 rounded-sm" />
          </div>
        )}
        {!isEmpty && !isGhost && activeEffect === 'fire' && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 opacity-80 rounded-sm animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-orange-300/50 to-red-500/50 rounded-sm" />
            <div 
              className="absolute inset-0 rounded-sm"
              style={{
                boxShadow: '0 0 20px rgba(255, 100, 0, 0.8), inset 0 0 10px rgba(255, 200, 0, 0.3)'
              }}
            />
          </div>
        )}
        {!isEmpty && !isGhost && activeEffect === 'ice' && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-200 via-blue-300 to-blue-500 opacity-70 rounded-sm" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-cyan-200/30 to-transparent rounded-sm" />
            <div 
              className="absolute inset-0 rounded-sm animate-pulse"
              style={{
                boxShadow: '0 0 15px rgba(0, 200, 255, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.4)'
              }}
            />
          </div>
        )}
        {!isEmpty && !isGhost && activeEffect === 'electric' && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500 opacity-80 rounded-sm animate-pulse" />
            <div 
              className="absolute inset-0 rounded-sm"
              style={{
                boxShadow: '0 0 25px rgba(0, 255, 255, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.3)',
                animation: 'pulse 0.5s ease-in-out infinite alternate'
              }}
            />
            {((x + y * 10) % 7) < 2 && (
              <div className="absolute inset-0 bg-white/50 rounded-sm animate-ping" />
            )}
          </div>
        )}
        {!isEmpty && !isGhost && activeEffect === 'matrix' && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-green-300 via-green-500 to-green-700 opacity-80 rounded-sm" />
            <div 
              className="absolute inset-0 rounded-sm animate-pulse"
              style={{
                boxShadow: '0 0 20px rgba(0, 255, 0, 0.8), inset 0 0 8px rgba(0, 255, 0, 0.3)'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-green-200 font-bold">
              {(x + y) % 2 === 0 ? '1' : '0'}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Create a combined board with ghost piece
  const getBoardWithGhost = () => {
    const displayBoard = board.map(row => [...row]);
    
    // Add ghost piece to the board
    if (currentPiece && settings.ghostPiece && ghostY !== null) {
      // Only show ghost if it's valid and below the current piece
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const boardY = ghostY + row;
            const boardX = currentPiece.x + col;
            
            if (boardY >= 0 && boardY < BOARD_HEIGHT && 
                boardX >= 0 && boardX < BOARD_WIDTH && 
                displayBoard[boardY][boardX] === 0) {   // <-- AJOUT
              // Mark ghost piece cells with negative values to distinguish them
              displayBoard[boardY][boardX] = -(currentPiece.color + 1);
            }
          }
        }
      }
    }
    
    // Add current piece to the board, but filter out parts that are on disappearing lines
    if (currentPiece && !isAnimatingLines) {
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const boardY = currentPiece.y + row;
            const boardX = currentPiece.x + col;
            
            if (boardY >= 0 && boardY < BOARD_HEIGHT && 
                boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color + 1;
            }
          }
        }
      }
    } else if (currentPiece && isAnimatingLines) {
      // During line clearing animation, only show parts of the current piece that are NOT on disappearing lines
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const boardY = currentPiece.y + row;
            const boardX = currentPiece.x + col;
            
            if (boardY >= 0 && boardY < BOARD_HEIGHT && 
                boardX >= 0 && boardX < BOARD_WIDTH &&
                !disappearingLines.includes(boardY) && 
                !highlightedLines.includes(boardY)) {
              // Only show the piece part if it's not on a line being cleared
              displayBoard[boardY][boardX] = currentPiece.color + 1;
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  const ghostY = currentPiece && settings.ghostPiece ? getGhostPieceY(board, currentPiece) : null;
  
  // Memoize the display board to avoid recalculating on every render
  const displayBoard = useMemo(() => getBoardWithGhost(), [board, currentPiece, ghostY, settings.ghostPiece, isAnimatingLines, disappearingLines, highlightedLines]);

  // Helper function to display key names
  const getKeyDisplay = (key) => {
    const keyMap = {
      ' ': 'Espace',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'Enter': 'Entrée',
      'Escape': 'Échap',
      'Shift': 'Maj',
      'Control': 'Ctrl',
      'Alt': 'Alt',
      'Tab': 'Tab',
      'Backspace': 'Retour',
      'Delete': 'Suppr'
    };
    return keyMap[key] || key.toUpperCase();
  };

  return (
    <div className="flex gap-8 p-8">
      {/* Left Panel - Controls and Hold */}
      <div className="flex flex-col gap-4">
        {/* Controls */}
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">CONTRÔLES</h3>
          <div className="text-xs space-y-1">
            {(() => {
              const keyBindings = settings.keyBindings || {
                moveLeft: 'ArrowLeft',
                moveRight: 'ArrowRight',
                softDrop: 'ArrowDown',
                hardDrop: ' ',
                rotate: 'ArrowUp',
                hold: 'c',
                pause: 'p'
              };
              return (
                <>
                  <p><span className="font-mono">{getKeyDisplay(keyBindings.moveLeft)} {getKeyDisplay(keyBindings.moveRight)}</span> : Déplacer</p>
                  <p><span className="font-mono">{getKeyDisplay(keyBindings.softDrop)}</span> : Descendre</p>
                  <p><span className="font-mono">{getKeyDisplay(keyBindings.rotate)}</span> : Tourner</p>
                  <p><span className="font-mono">{getKeyDisplay(keyBindings.hardDrop)}</span> : Drop</p>
                  <p><span className="font-mono">{getKeyDisplay(keyBindings.hold)}</span> : Hold</p>
                  <p><span className="font-mono">{getKeyDisplay(keyBindings.pause)}</span> : Pause</p>
                </>
              );
            })()}
          </div>
        </div>

        {/* Hold Box */}
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">HOLD (C)</h3>
          <div className="grid grid-cols-4 gap-1 w-24 h-24">
            {(() => {
              // Create a 4x4 grid for display
              const displayGrid = Array(4).fill(null).map(() => Array(4).fill(0));
              
              if (holdPiece) {
                // Calculate offset to center the piece in the 4x4 grid
                const offsetY = Math.floor((4 - holdPiece.shape.length) / 2);
                const offsetX = Math.floor((4 - holdPiece.shape[0].length) / 2);
                
                // Place the piece in the display grid
                holdPiece.shape.forEach((row, y) => {
                  row.forEach((value, x) => {
                    if (value) {
                      const gridY = y + offsetY;
                      const gridX = x + offsetX;
                      if (gridY >= 0 && gridY < 4 && gridX >= 0 && gridX < 4) {
                        displayGrid[gridY][gridX] = holdPiece.color + 1;
                      }
                    }
                  });
                });
              }
              
              // Render the display grid
              return displayGrid.map((row, y) =>
                row.map((value, x) => (
                  <div
                    key={`hold-${x}-${y}`}
                    className="w-5 h-5 border border-gray-800/30"
                    style={{
                      backgroundColor: value ? colors[value - 1] : 'transparent'
                    }}
                  />
                ))
              );
            })()}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative">
        <ScreenShake 
          intensity={shakeIntensity} 
          duration={500 + (shakeIntensity * 100)}
          className="relative"
        >
          <div
            ref={boardRef}
            className="relative bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden"
            style={{ width: `${BOARD_WIDTH * 30}px`, height: `${BOARD_HEIGHT * 30}px` }}
          >
          {/* Grid with integrated ghost and current piece */}
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-20">
            {displayBoard.map((row, y) =>
              row.map((cell, x) => {
                if (cell < 0) {
                  // Ghost piece cell
                  return renderCell(0, x, y, true, Math.abs(cell) - 1);
                } else {
                  // Regular cell or current piece cell
                  return renderCell(cell, x, y);
                }
              })
            )}
          </div>

          {/* Visual Effects */}
          <VisualEffects 
            effect={activeEffect}
            isActive={!isPaused && !gameOver}
            boardRef={boardRef}
          />

          {/* Particle Effects for Line Clears */}
          <ParticleEffects 
            linesCleared={lastLinesCleared}
            position={linesClearPosition}
            effect={activeEffect}
          />

          {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/75 flex items-center justify-center z-10"
              >
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-white mb-4">PAUSE</h2>
                  <p className="text-gray-300">Appuyez sur {getKeyDisplay((settings.keyBindings || { pause: 'p' }).pause)} pour continuer</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over Overlay */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/75 flex items-center justify-center z-10"
              >
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
                  <p className="text-2xl text-white mb-2">Score: {score}</p>
                  <p className="text-gray-300">Appuyez sur ENTER pour rejouer</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </ScreenShake>
        
        {/* Score Impact Effect */}
        {scoreImpactData && (
          <ScoreImpact
            key={scoreImpactKey}
            score={scoreImpactData.score}
            linesCleared={scoreImpactData.linesCleared}
            scoreChange={scoreImpactData.scoreChange}
            comboCount={scoreImpactData.comboCount}
            comboBonus={scoreImpactData.comboBonus}
            effect={activeEffect}
            position={{ 
              x: (BOARD_WIDTH * 30) / 2, 
              y: (BOARD_HEIGHT * 30) / 2 
            }}
            onAnimationComplete={() => setScoreImpactData(null)}
          />
        )}
      </div>

      {/* Right Panel - Next Pieces and Score Info */}
      <div className="flex flex-col gap-4">
        {/* Next Pieces */}
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">NEXT</h3>
          <div className="flex flex-col gap-2">
            {nextPieces.map((piece, index) => {
              // Create a 4x4 grid for each piece
              const displayGrid = Array(4).fill(null).map(() => Array(4).fill(0));
              
              // Calculate offset to center the piece in the 4x4 grid
              const offsetY = Math.floor((4 - piece.shape.length) / 2);
              const offsetX = Math.floor((4 - piece.shape[0].length) / 2);
              
              // Place the piece in the display grid
              piece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                  if (value) {
                    const gridY = y + offsetY;
                    const gridX = x + offsetX;
                    if (gridY >= 0 && gridY < 4 && gridX >= 0 && gridX < 4) {
                      displayGrid[gridY][gridX] = piece.color + 1;
                    }
                  }
                });
              });
              
              return (
                <div key={index} className="grid grid-cols-4 gap-1 w-24 h-16">
                  {displayGrid.slice(0, 3).map((row, y) =>
                    row.map((value, x) => (
                      <div
                        key={`next-${index}-${x}-${y}`}
                        className="w-5 h-5 border border-gray-800/30"
                        style={{
                          backgroundColor: value ? colors[value - 1] : 'transparent'
                        }}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Display with Progress */}
        <LevelDisplay />

        {/* Score Info */}
        <div className="card p-4">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-400">SCORE</p>
              <p className="text-2xl font-bold">{score.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">COMBO</p>
              <p className={`text-2xl font-bold ${currentCombo > 0 ? 'text-orange-400' : 'text-white'}`}>
                {currentCombo > 0 ? `x${currentCombo}` : '-'}
              </p>
            </div>
            {maxCombo > 0 && (
              <div>
                <p className="text-sm text-gray-400">MAX COMBO</p>
                <p className="text-lg font-bold text-yellow-400">x{maxCombo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Effect Display */}
        {activeEffect !== 'none' && (
          <div className="card p-4">
            <div>
              <p className="text-sm text-gray-400">EFFET ACTIF</p>
              <p className="text-lg font-bold text-cyan-400">
                {activeEffect === 'rainbow' && 'Arc-en-ciel'}
                {activeEffect === 'fire' && 'Feu'}
                {activeEffect === 'ice' && 'Glace'}
                {activeEffect === 'electric' && 'Électrique'}
                {activeEffect === 'matrix' && 'Matrix'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TetrisGame;
