import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import soundManager from '../utils/soundManager';
import inputManager from '../utils/inputManager';
import VisualEffects from './VisualEffects';
import ParticleEffects from './ParticleEffects';
import ScreenShake from './ScreenShake';
import ScoreImpact from './ScoreImpact';
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
  const gameLoopRef = useRef();
  const boardRef = useRef();
  const scoreRef = useRef();

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
    currentEffect,
    currentCombo,
    maxCombo,
    updateScore,
    updateLevel,
    updateLines,
    setPaused,
    setGameOver,
    resetGame,
    incrementCombo,
    resetCombo
  } = useGameStore();

  const theme = themes.find(t => t.id === currentTheme);
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
    if (currentEffect === 'rainbow') {
      const interval = setInterval(() => {
        hueRef.current = (hueRef.current + 5) % 360;
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentEffect]);

  // Initialize game
  useEffect(() => {
    startNewGame();
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  // Optimized game loop with requestAnimationFrame
  useEffect(() => {
    if (isPaused || gameOver || isHardDropping || isAnimatingLines) return;

    const step = gameSpeed; // en ms/ligne
    let raf;

    const loop = (t) => {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = t - lastTimeRef.current;
      lastTimeRef.current = t;

      accRef.current += dt;
      while (accRef.current >= step) {
        const piece = currentPieceRef.current;
        if (!piece) break;
        if (isValidPosition(boardStateRef.current, piece, piece.x, piece.y + 1)) {
          setCurrentPiece(p => p ? { ...p, y: p.y + 1 } : p);
        } else {
          lockPieceRef.current();
        }
        accRef.current -= step;
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
    if (!currentPiece || isAnimatingLines) return;

    const newBoard = mergePiece(board, currentPiece);
    const linesToClear = getLinesToClear(newBoard);
    
    if (linesToClear.length > 0) {
      // Clear current piece immediately when lines are being cleared
      setCurrentPiece(null);
      
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
        }, 250); // Duration of disappear animation
      }, 150); // Duration of highlight animation
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
    if (!currentPiece || isPaused || gameOver) return;
    
    if (isValidPosition(board, currentPiece, currentPiece.x - 1, currentPiece.y)) {
      setCurrentPiece({
        ...currentPiece,
        x: currentPiece.x - 1
      });
      soundManager.playSound('move', settings);
    }
  }, [currentPiece, board, isPaused, gameOver, settings]);

  const moveRight = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    
    if (isValidPosition(board, currentPiece, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece({
        ...currentPiece,
        x: currentPiece.x + 1
      });
      soundManager.playSound('move', settings);
    }
  }, [currentPiece, board, isPaused, gameOver, settings]);

  const rotate = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return;
    
    const rotated = tryRotate(board, currentPiece);
    if (rotated) {
      setCurrentPiece(rotated);
      soundManager.playSound('rotate', settings);
    }
  }, [currentPiece, board, isPaused, gameOver, settings]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || isPaused || gameOver || isHardDropping || isAnimatingLines) return;
    
    const ghostY = getGhostPieceY(board, currentPiece);
    const dropDistance = ghostY - currentPiece.y;
    
    // Set hard dropping state to prevent game loop interference
    setIsHardDropping(true);
    
    // Create the dropped piece with the new position
    const droppedPiece = {
      ...currentPiece,
      y: ghostY
    };
    
    // Update score for the drop distance
    updateScore(dropDistance * 2);
    soundManager.playSound('drop', settings);
    
    // Immediately lock the piece at the correct position
    const newBoard = mergePiece(board, droppedPiece);
    const linesToClear = getLinesToClear(newBoard);
    
    if (linesToClear.length > 0) {
      // Clear current piece immediately when lines are being cleared
      setCurrentPiece(null);
      
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
        }, 250); // Duration of disappear animation
      }, 150); // Duration of highlight animation
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
    setHoldPiece({
      ...currentPiece,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece.shape[0].length / 2),
      y: 0
    });
    
    if (temp) {
      setCurrentPiece(temp);
    } else {
      const newPiece = getNewPiece();
      setCurrentPiece(newPiece);
    }
    
    setCanHold(false);
    soundManager.playSound('move', settings);
  }, [currentPiece, holdPiece, canHold, isPaused, gameOver, settings]);

  // Professional Input Manager with DAS/ARR
  useEffect(() => {
    // Initialize input manager
    inputManager.init();
    
    // Update input manager settings from store
    inputManager.updateSettings({
      das: settings.das,
      arr: settings.arr,
      sdf: settings.sdf
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
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, hold, isPaused, gameOver, settings.das, settings.arr, settings.sdf]);

  const renderCell = (value, x, y, isGhost = false, ghostColor = null) => {
    const isEmpty = value === 0 && !isGhost;
    const color = isGhost && ghostColor !== null && ghostColor !== undefined
      ? colors[ghostColor]
      : (isEmpty ? 'transparent' : colors[value - 1]);
    
    // Check if this cell is part of a line being animated
    const isHighlighted = highlightedLines.includes(y);
    const isDisappearing = disappearingLines.includes(y);
    
    if (isGhost && ghostColor !== null) {
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
        {!isEmpty && !isGhost && currentEffect === 'rainbow' && (
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
        {!isEmpty && !isGhost && currentEffect === 'fire' && (
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
        {!isEmpty && !isGhost && currentEffect === 'ice' && (
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
        {!isEmpty && !isGhost && currentEffect === 'electric' && (
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
        {!isEmpty && !isGhost && currentEffect === 'matrix' && (
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
                displayBoard[boardY][boardX] === 0) {
              // Mark ghost piece cells with negative values to distinguish them
              displayBoard[boardY][boardX] = -(currentPiece.color + 1);
            }
          }
        }
      }
    }
    
    // Add current piece to the board
    if (currentPiece) {
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
    }
    
    return displayBoard;
  };

  const ghostY = currentPiece && settings.ghostPiece ? getGhostPieceY(board, currentPiece) : null;
  
  // Memoize the display board to avoid recalculating on every render
  const displayBoard = useMemo(() => getBoardWithGhost(), [board, currentPiece, ghostY, settings.ghostPiece]);

  return (
    <div className="flex gap-8 p-8">
      {/* Hold Box */}
      <div className="flex flex-col gap-4">
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
            effect={currentEffect}
            isActive={!isPaused && !gameOver}
            boardRef={boardRef}
          />

          {/* Particle Effects for Line Clears */}
          <ParticleEffects 
            linesCleared={lastLinesCleared}
            position={linesClearPosition}
            effect={currentEffect}
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
                  <p className="text-gray-300">Appuyez sur P pour continuer</p>
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
            effect={currentEffect}
            position={{ 
              x: (BOARD_WIDTH * 30) / 2, 
              y: (BOARD_HEIGHT * 30) / 2 
            }}
            onAnimationComplete={() => setScoreImpactData(null)}
          />
        )}
      </div>

      {/* Info Panel */}
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

        {/* Score Info */}
        <div className="card p-4">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-400">SCORE</p>
              <p className="text-2xl font-bold">{score.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">LEVEL</p>
              <p className="text-2xl font-bold">{level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">LINES</p>
              <p className="text-2xl font-bold">{lines}</p>
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

        {/* Controls */}
        <div className="card p-4">
          <h3 className="text-sm font-bold text-gray-400 mb-2">CONTROLS</h3>
          <div className="text-xs space-y-1">
            <p>← → : Déplacer</p>
            <p>↓ : Descendre</p>
            <p>↑ : Tourner</p>
            <p>Espace : Drop</p>
            <p>C : Hold</p>
            <p>P : Pause</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
