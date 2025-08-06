import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VisualEffects = ({ effect, isActive, boardRef, onLinesCleared }) => {
  const effectRef = useRef();
  const [matrixChars, setMatrixChars] = useState([]);
  const [fireParticles, setFireParticles] = useState([]);
  const [electricBolts, setElectricBolts] = useState([]);
  const [rainbowColors, setRainbowColors] = useState([]);

  // Matrix effect - falling code characters
  useEffect(() => {
    if (effect === 'matrix' && isActive) {
      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      const columns = 20;
      const drops = Array(columns).fill(0);
      
      const interval = setInterval(() => {
        setMatrixChars(prev => {
          const newChars = [];
          for (let i = 0; i < columns; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * 15;
            const y = drops[i] * 20;
            
            if (y > 600 && Math.random() > 0.975) {
              drops[i] = 0;
            }
            drops[i]++;
            
            newChars.push({
              id: `${i}-${Date.now()}`,
              char,
              x,
              y: y % 620,
              opacity: Math.random() * 0.8 + 0.2
            });
          }
          return newChars;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setMatrixChars([]);
    }
  }, [effect, isActive]);

  // Fire effect - animated particles
  useEffect(() => {
    if (effect === 'fire' && isActive) {
      const interval = setInterval(() => {
        setFireParticles(prev => {
          const newParticles = [...prev];
          
          // Add new particles
          for (let i = 0; i < 5; i++) {
            newParticles.push({
              id: Date.now() + i,
              x: Math.random() * 300,
              y: 600,
              size: Math.random() * 8 + 4,
              life: 1,
              velocity: Math.random() * 3 + 1
            });
          }
          
          // Update existing particles
          return newParticles
            .map(particle => ({
              ...particle,
              y: particle.y - particle.velocity,
              life: particle.life - 0.02,
              size: particle.size * 0.98
            }))
            .filter(particle => particle.life > 0 && particle.y > -50);
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setFireParticles([]);
    }
  }, [effect, isActive]);

  // Electric effect - lightning bolts
  useEffect(() => {
    if (effect === 'electric' && isActive) {
      const interval = setInterval(() => {
        setElectricBolts(prev => {
          const newBolts = [];
          for (let i = 0; i < 3; i++) {
            const points = [];
            let x = Math.random() * 300;
            let y = 0;
            
            while (y < 600) {
              points.push({ x, y });
              x += (Math.random() - 0.5) * 40;
              y += Math.random() * 50 + 20;
            }
            
            newBolts.push({
              id: Date.now() + i,
              points,
              life: 1
            });
          }
          return newBolts;
        });
        
        setTimeout(() => {
          setElectricBolts([]);
        }, 200);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [effect, isActive]);

  // Rainbow effect - cycling colors
  useEffect(() => {
    if (effect === 'rainbow' && isActive) {
      const interval = setInterval(() => {
        setRainbowColors(prev => {
          const hue = (Date.now() / 10) % 360;
          return Array.from({ length: 10 }, (_, i) => ({
            hue: (hue + i * 36) % 360,
            saturation: 100,
            lightness: 50 + Math.sin(Date.now() / 500 + i) * 20
          }));
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [effect, isActive]);

  const renderMatrixEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {matrixChars.map(char => (
        <motion.div
          key={char.id}
          className="absolute text-green-400 font-mono text-sm font-bold"
          style={{
            left: char.x,
            top: char.y,
            opacity: char.opacity,
            textShadow: '0 0 10px #00ff00'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: char.opacity }}
          exit={{ opacity: 0 }}
        >
          {char.char}
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-900/10 to-green-900/20" />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );

  const renderFireEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {fireParticles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, 
              rgba(255, ${Math.floor(255 * particle.life)}, 0, ${particle.life}) 0%, 
              rgba(255, ${Math.floor(100 * particle.life)}, 0, ${particle.life * 0.8}) 50%, 
              rgba(255, 0, 0, ${particle.life * 0.6}) 100%)`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(255, ${Math.floor(100 * particle.life)}, 0, ${particle.life})`
          }}
          animate={{
            scale: [1, 1.2, 0.8],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-red-900/30 via-orange-900/20 to-transparent" />
    </div>
  );

  const renderElectricEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {electricBolts.map(bolt => (
          <motion.svg
            key={bolt.id}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <motion.path
              d={`M ${bolt.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
              stroke="#00ffff"
              strokeWidth="3"
              fill="none"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2 }}
            />
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </motion.svg>
        ))}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-transparent animate-pulse" />
    </div>
  );

  const renderIceEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-200/20 via-cyan-300/15 to-white/10" />
      <div className="absolute inset-0">
        {Array.from({ length: 50 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/10 to-cyan-400/20 animate-pulse" />
    </div>
  );

  const renderRainbowEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #0000ff, #8800ff)',
            'linear-gradient(90deg, #ff8800, #ffff00, #00ff00, #0088ff, #0000ff, #8800ff, #ff0000)',
            'linear-gradient(135deg, #ffff00, #00ff00, #0088ff, #0000ff, #8800ff, #ff0000, #ff8800)',
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ opacity: 0.3 }}
      />
      <div className="absolute inset-0">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${(i * 5) % 100}%`,
              top: `${Math.sin(i) * 50 + 50}%`,
              background: `hsl(${(i * 18) % 360}, 100%, 50%)`,
              boxShadow: `0 0 10px hsl(${(i * 18) % 360}, 100%, 50%)`
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );

  if (!isActive || effect === 'none') return null;

  return (
    <div ref={effectRef} className="absolute inset-0 pointer-events-none z-10">
      {effect === 'matrix' && renderMatrixEffect()}
      {effect === 'fire' && renderFireEffect()}
      {effect === 'electric' && renderElectricEffect()}
      {effect === 'ice' && renderIceEffect()}
      {effect === 'rainbow' && renderRainbowEffect()}
    </div>
  );
};

export default VisualEffects;
