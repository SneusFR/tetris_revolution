import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';

const LevelDisplay = () => {
  const { 
    level, 
    lines, 
    getLinesForNextLevel, 
    getLevelProgress,
    levelChanged,
    currentEffect,
    themes,
    currentTheme
  } = useGameStore();
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(level);
  
  const theme = themes.find(t => t.id === currentTheme);
  const primaryColor = theme ? theme.colors[0] : '#00ffff';
  const secondaryColor = theme ? theme.colors[1] : '#ff00ff';
  
  const linesForNext = getLinesForNextLevel();
  const progress = getLevelProgress();
  
  // Détection du changement de niveau pour l'animation
  useEffect(() => {
    if (level > previousLevel) {
      setShowLevelUp(true);
      setPreviousLevel(level);
    }
  }, [level, previousLevel]);
  
  // Timer séparé pour masquer l'animation après 2 secondes
  useEffect(() => {
    if (showLevelUp) {
      const timer = setTimeout(() => {
        setShowLevelUp(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showLevelUp]);
  
  // Calcul de la vitesse actuelle en pièces par seconde
  const gameSpeed = useGameStore(state => state.gameSpeed);
  const piecesPerSecond = (1000 / gameSpeed).toFixed(1);
  
  return (
    <div className="relative">
      {/* Affichage principal du niveau */}
      <motion.div 
        className="card p-4 relative overflow-hidden"
        animate={{
          boxShadow: levelChanged 
            ? `0 0 30px ${primaryColor}80, 0 0 60px ${primaryColor}40`
            : `0 0 10px ${primaryColor}20`
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Effet de fond animé */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(45deg, ${primaryColor}20, ${secondaryColor}20)`
          }}
        />
        
        {/* Contenu principal */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-400">NIVEAU</h3>
            <motion.div 
              className="text-xs text-gray-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {piecesPerSecond} pps
            </motion.div>
          </div>
          
          {/* Numéro du niveau avec effet */}
          <motion.div 
            className="text-4xl font-bold mb-4 relative"
            style={{ color: primaryColor }}
            animate={{
              textShadow: currentEffect === 'electric' 
                ? `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`
                : `0 0 10px ${primaryColor}80`
            }}
            transition={{ duration: 0.3 }}
          >
            {level}
            
            {/* Particules d'effet autour du niveau */}
            {currentEffect === 'fire' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-orange-400 rounded-full"
                    style={{
                      left: `${20 + i * 20}%`,
                      top: `${10 + i * 15}%`
                    }}
                    animate={{
                      y: [-5, -15, -5],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
          
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progression</span>
              <span>{linesForNext} lignes restantes</span>
            </div>
            
            <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
              {/* Fond de la barre avec effet de lueur */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}10, ${secondaryColor}10)`
                }}
              />
              
              {/* Barre de progression animée */}
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
                }}
                initial={{ width: 0 }}
                animate={{ 
                  width: `${progress}%`,
                  boxShadow: `0 0 15px ${primaryColor}80`
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Effet de brillance qui se déplace */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatDelay: 1 
                  }}
                />
              </motion.div>
              
              {/* Indicateurs de progression */}
              <div className="absolute inset-0 flex justify-between items-center px-1">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="w-px h-2 bg-gray-600"
                    style={{ opacity: i * 10 < progress ? 0 : 0.5 }}
                  />
                ))}
              </div>
            </div>
            
            {/* Pourcentage de progression */}
            <div className="text-center">
              <motion.span 
                className="text-sm font-semibold"
                style={{ color: primaryColor }}
                animate={{ 
                  scale: progress > 90 ? [1, 1.1, 1] : 1 
                }}
                transition={{ duration: 0.5, repeat: progress > 90 ? Infinity : 0 }}
              >
                {Math.round(progress)}%
              </motion.span>
            </div>
          </div>
          
          {/* Informations supplémentaires */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Lignes totales: {lines}</span>
              <span>Vitesse: {Math.round(1000 / gameSpeed * 60)} LPM</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Animation de montée de niveau */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="bg-black/90 rounded-xl p-6 border-2 text-center"
              style={{ 
                borderColor: primaryColor,
                boxShadow: `0 0 50px ${primaryColor}80`
              }}
              animate={{
                boxShadow: [
                  `0 0 50px ${primaryColor}80`,
                  `0 0 80px ${primaryColor}`,
                  `0 0 50px ${primaryColor}80`
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <motion.div
                className="text-2xl font-bold mb-2"
                style={{ 
                  color: primaryColor,
                  textShadow: `0 0 20px ${primaryColor}`
                }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  textShadow: [
                    `0 0 20px ${primaryColor}`,
                    `0 0 40px ${primaryColor}`,
                    `0 0 20px ${primaryColor}`
                  ]
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                NIVEAU {level}
              </motion.div>
              <motion.div
                className="text-sm text-gray-300"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Vitesse augmentée !
              </motion.div>
              
              {/* Particules d'explosion */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i % 2 === 0 ? primaryColor : secondaryColor,
                    left: '50%',
                    top: '50%'
                  }}
                  animate={{
                    x: Math.cos(i * Math.PI / 4) * 60,
                    y: Math.sin(i * Math.PI / 4) * 60,
                    opacity: [1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LevelDisplay;
