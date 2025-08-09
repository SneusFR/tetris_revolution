import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, LazyMotion, domAnimation, useReducedMotion, MotionConfig } from 'framer-motion';

const ScoreImpact = ({ 
  score, 
  linesCleared, 
  effect = 'none', 
  position = { x: 0, y: 0 },
  onAnimationComplete,
  scoreChange,
  comboCount = 0,
  comboBonus = 0
}) => {
  const [showImpact, setShowImpact] = useState(false);
  const [impactParticles, setImpactParticles] = useState([]);
  const prefersReducedMotion = useReducedMotion();

  // Perf mode: kick in for Tetris (4 lines) or if the OS prefers reduced motion
  const perfMode = linesCleared === 4 || prefersReducedMotion;

  // Optimize particle generation with useCallback
  const generateImpactParticles = useCallback(() => {
    const particles = [];
    const particleCount = perfMode
      ? Math.min(linesCleared * 6, 18)     // trimmed on heavy events
      : Math.min(linesCleared * 12, 40);
    const intensity = Math.min(linesCleared, 4); // Max intensity for Tetris

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: position.x + (Math.random() - 0.5) * 100,
        y: position.y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * (intensity * 8),
        vy: (Math.random() - 0.5) * (intensity * 8),
        size: Math.random() * (intensity * 2) + 2,
        life: 1,
        color: getParticleColor(effect, i, intensity),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * (intensity * 5)
      });
    }
    setImpactParticles(particles);
  }, [linesCleared, effect, position.x, position.y, perfMode]);

  useEffect(() => {
    if (linesCleared > 0) {
      setShowImpact(true);
      generateImpactParticles();
      
      const timer = setTimeout(() => {
        setShowImpact(false);
        setImpactParticles([]);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, perfMode ? 1100 : 2000);

      return () => clearTimeout(timer);
    }
  }, [linesCleared, onAnimationComplete, generateImpactParticles, perfMode]);

  const getParticleColor = (effect, index, intensity) => {
    const alpha = 0.8 + (intensity * 0.2);
    
    switch (effect) {
      case 'fire':
        return `hsla(${Math.random() * 60}, 100%, ${60 + Math.random() * 30}%, ${alpha})`;
      case 'ice':
        return `hsla(${180 + Math.random() * 60}, 90%, ${70 + Math.random() * 20}%, ${alpha})`;
      case 'electric':
        return `hsla(${180 + Math.random() * 60}, 100%, ${80 + Math.random() * 20}%, ${alpha})`;
      case 'matrix':
        return `hsla(120, ${80 + Math.random() * 20}%, ${50 + Math.random() * 30}%, ${alpha})`;
      case 'rainbow':
        return `hsla(${(index * 36) % 360}, 100%, 60%, ${alpha})`;
      default:
        return `hsla(${Math.random() * 360}, 70%, 60%, ${alpha})`;
    }
  };

  const getImpactIntensity = () => {
    switch (linesCleared) {
      case 1: return 1;
      case 2: return 1.5;
      case 3: return 2;
      case 4: return 3; // Tetris!
      default: return 1;
    }
  };

  const getScoreText = () => {
    switch (linesCleared) {
      case 4: return 'TETRIS!';
      case 3: return 'TRIPLE!';
      case 2: return 'DOUBLE!';
      case 1: return 'SINGLE!';
      default: return 'CLEAR!';
    }
  };

  const getScoreColor = () => {
    switch (linesCleared) {
      case 4: return '#FFD700'; // Gold for Tetris
      case 3: return '#FF6B35'; // Orange for Triple
      case 2: return '#4ECDC4'; // Teal for Double
      case 1: return '#45B7D1'; // Blue for Single
      default: return '#FFFFFF';
    }
  };

  const renderScoreImpact = () => {
    const intensity = getImpactIntensity();
    const DUR = perfMode ? 1.0 : 1.8;

    return (
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          contain: 'paint',
          willChange: 'transform, opacity',
          transform: 'translate3d(0,0,0)'
        }}
      >
        {/* Score explosion effect */}
        <motion.div
          className="absolute"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, intensity * 1.5, intensity], opacity: [0, 1, 0.85, 0.6] }}
          exit={{ scale: 0.5, opacity: 0, y: -40 }}
          transition={{ 
            duration: DUR, 
            ease: "easeOut",
            opacity: { duration: DUR + 0.2 }
          }}
        >
          {/* Main impact circle */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: `${intensity * 80}px`,
              height: `${intensity * 80}px`,
              background: effect === 'fire' 
                ? 'radial-gradient(circle, rgba(255,100,0,0.8) 0%, rgba(255,0,0,0.4) 50%, transparent 100%)'
                : effect === 'ice'
                ? 'radial-gradient(circle, rgba(100,200,255,0.8) 0%, rgba(0,150,255,0.4) 50%, transparent 100%)'
                : effect === 'electric'
                ? 'radial-gradient(circle, rgba(0,255,255,0.9) 0%, rgba(0,100,255,0.5) 50%, transparent 100%)'
                : effect === 'matrix'
                ? 'radial-gradient(circle, rgba(0,255,0,0.8) 0%, rgba(0,150,0,0.4) 50%, transparent 100%)'
                : effect === 'rainbow'
                ? 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #0000ff, #8800ff, #ff0000)'
                : 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 0.8, 0.6, 0.3, 0],
              scale: [0.5, 1.2, 1.5, 1.8, 2]
            }}
            transition={{ 
              duration: DUR + 0.2,
              times: [0, 0.2, 0.5, 0.8, 1],
              ease: "easeOut"
            }}
          />
          
          {/* Score text */}
          <motion.div
            className="absolute text-center font-bold"
            style={{
              transform: 'translate(-50%, -50%)',
              fontSize: `${intensity * 10 + 2}px`,
              color: getScoreColor(),
              // lighter glow: cheaper than huge textShadow stacks
              textShadow: perfMode ? 'none' : `0 0 ${Math.max(6, intensity * 8)}px ${getScoreColor()}`,
              fontFamily: 'Orbitron, monospace',
              willChange: 'transform, opacity'
            }}
            initial={{ scale: 0, y: 20, opacity: 0 }}
            animate={{ 
              scale: [0, 1.3, 1.1, 1], 
              y: [20, -40, -30, -25],
              opacity: [0, 1, 1, 0.85, 0],
              rotate: [0, intensity * 8, -intensity * 3, 0]
            }}
            exit={{ 
              scale: 0.3, 
              y: -60, 
              opacity: 0,
              rotate: intensity * 10
            }}
            transition={{ 
              duration: DUR, 
              ease: "easeOut",
              opacity: { 
                times: [0, 0.1, 0.7, 0.9, 1],
                duration: DUR
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1.2, 1] }}
              transition={{ duration: 0.6, ease: "backOut" }}
            >
              {getScoreText()}
            </motion.div>
            
            {/* Combo text */}
            {comboCount > 1 && (
              <motion.div
                style={{
                  fontSize: `${intensity * 12 + 14}px`,
                  marginTop: '8px',
                  color: '#FF6B35',
                  textShadow: '0 0 15px #FF6B35, 0 0 30px #FF6B35',
                  fontWeight: 'bold'
                }}
                initial={{ scale: 0, opacity: 0, y: 10 }}
                animate={{ 
                  scale: [0, 1.4, 1.2, 1], 
                  opacity: [0, 1, 1, 0.9],
                  y: [10, -5, 0, 0]
                }}
                transition={{ duration: 1.0, delay: 0.3, ease: "backOut" }}
              >
                COMBO x{comboCount}!
              </motion.div>
            )}
            
            <motion.div 
              style={{ 
                fontSize: `${intensity * 8 + 12}px`, 
                marginTop: comboCount > 1 ? '8px' : '5px',
                color: '#ffffff',
                textShadow: `0 0 ${intensity * 5}px #ffffff`
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 0.9] }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              +{scoreChange.toLocaleString()}
              {comboBonus > 0 && (
                <motion.span
                  style={{
                    display: 'block',
                    fontSize: `${intensity * 6 + 10}px`,
                    color: '#FFD700',
                    textShadow: '0 0 10px #FFD700',
                    marginTop: '2px'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.9] }}
                  transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                >
                  +{comboBonus} COMBO BONUS!
                </motion.span>
              )}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Particles */}
        {impactParticles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: effect === 'matrix' ? '0%' : '50%',
              // drop per-particle shadow – big win for paint cost
              willChange: 'transform, opacity'
            }}
            initial={{
              x: particle.x,
              y: particle.y,
              scale: 1,
              opacity: 1,
              rotate: particle.rotation
            }}
            animate={{
              x: particle.x + particle.vx * 30,
              y: particle.y + particle.vy * 30,
              scale: 0,
              opacity: 0,
              rotate: particle.rotation + particle.rotationSpeed * 30
            }}
            transition={{ 
              duration: perfMode ? 0.9 + Math.random() * 0.3 : 1.5 + Math.random() * 0.5, 
              ease: "easeOut" 
            }}
          >
            {effect === 'matrix' && (
              <div className="text-green-400 font-mono text-xs font-bold">
                {Math.random() > 0.5 ? '1' : '0'}
              </div>
            )}
          </motion.div>
        ))}

        {/* Special effects for Tetris */}
        {linesCleared === 4 && (
          <>
            {/* Lightning bolts for electric effect */}
            {effect === 'electric' && Array.from({ length: perfMode ? 6 : 12 }, (_, i) => (
              <motion.div
                key={`bolt-${i}`}
                className="absolute"
                style={{
                  left: position.x,
                  top: position.y,
                  width: '3px',
                  transformOrigin: 'top center',
                  background: 'linear-gradient(to bottom, rgba(0,255,255,1), rgba(0,255,255,0))',
                  willChange: 'transform, opacity'
                }}
                initial={{
                  height: 0,
                  opacity: 1,
                  rotate: i * 30
                }}
                animate={{
                  height: 150 + Math.random() * 100,
                  opacity: 0,
                }}
                transition={{ 
                  duration: perfMode ? 0.3 : 0.4, 
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Fire burst */}
            {effect === 'fire' && (
              <motion.div
                className="absolute"
                style={{
                  left: position.x,
                  top: position.y,
                  transform: 'translate(-50%, -50%)',
                  willChange: 'transform, opacity'
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: perfMode ? 3.2 : 4, opacity: 0 }}
                transition={{ duration: perfMode ? 0.8 : 1.2, ease: "easeOut" }}
              >
                <div
                  style={{
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,200,0,0.9) 0%, rgba(255,100,0,0.6) 30%, rgba(255,0,0,0.3) 60%, transparent 100%)',
                    borderRadius: '50%'
                  }}
                />
              </motion.div>
            )}
          </>
        )}
      </div>
    );
  };

  if (!showImpact || linesCleared === 0) return null;

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
        <AnimatePresence>
          {renderScoreImpact()}
        </AnimatePresence>
      </MotionConfig>
    </LazyMotion>
  );
};

export default ScoreImpact;
