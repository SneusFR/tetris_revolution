import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ParticleEffects = ({ linesCleared, position, effect }) => {
  const [particles, setParticles] = useState([]);
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    if (linesCleared > 0) {
      setShowExplosion(true);
      generateParticles();
      
      const timer = setTimeout(() => {
        setShowExplosion(false);
        setParticles([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [linesCleared, effect]);

  const generateParticles = () => {
    const newParticles = [];
    const particleCount = linesCleared * 20;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: position?.x || Math.random() * 300,
        y: position?.y || Math.random() * 600,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 6 + 2,
        life: 1,
        color: getParticleColor(effect, i),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    setParticles(newParticles);
  };

  const getParticleColor = (effect, index) => {
    switch (effect) {
      case 'fire':
        return `hsl(${Math.random() * 60}, 100%, ${50 + Math.random() * 30}%)`;
      case 'ice':
        return `hsl(${180 + Math.random() * 60}, 80%, ${70 + Math.random() * 20}%)`;
      case 'electric':
        return `hsl(${180 + Math.random() * 60}, 100%, ${80 + Math.random() * 20}%)`;
      case 'matrix':
        return `hsl(120, ${80 + Math.random() * 20}%, ${50 + Math.random() * 30}%)`;
      case 'rainbow':
        return `hsl(${(index * 36) % 360}, 100%, 60%)`;
      default:
        return `hsl(${Math.random() * 360}, 70%, 60%)`;
    }
  };

  const renderFireExplosion = () => (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{
          background: 'radial-gradient(circle, rgba(255,100,0,0.8) 0%, rgba(255,0,0,0.4) 50%, transparent 100%)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100px',
          height: '100px'
        }}
      />
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 1,
            opacity: 1,
            rotate: particle.rotation
          }}
          animate={{
            x: particle.x + particle.vx * 50,
            y: particle.y + particle.vy * 50,
            scale: 0,
            opacity: 0,
            rotate: particle.rotation + particle.rotationSpeed * 50
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
          }}
        />
      ))}
    </div>
  );

  const renderIceExplosion = () => (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          background: 'radial-gradient(circle, rgba(100,200,255,0.6) 0%, rgba(0,150,255,0.3) 50%, transparent 100%)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '150px',
          height: '150px',
          borderRadius: '50%'
        }}
      />
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute"
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 1,
            opacity: 1,
            rotate: 0
          }}
          animate={{
            x: particle.x + particle.vx * 30,
            y: particle.y + particle.vy * 30 + 100,
            scale: 0.2,
            opacity: 0,
            rotate: 720
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            boxShadow: `0 0 ${particle.size}px ${particle.color}`
          }}
        />
      ))}
    </div>
  );

  const renderElectricExplosion = () => (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          background: 'radial-gradient(circle, rgba(0,255,255,0.8) 0%, rgba(0,100,255,0.4) 30%, transparent 70%)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80px',
          height: '80px',
          borderRadius: '50%'
        }}
      />
      {/* Lightning bolts */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`bolt-${i}`}
          className="absolute bg-cyan-400"
          initial={{
            x: position?.x || 150,
            y: position?.y || 300,
            width: 2,
            height: 0,
            opacity: 1
          }}
          animate={{
            height: 100 + Math.random() * 100,
            opacity: 0,
            rotate: i * 45
          }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          style={{
            transformOrigin: 'top center',
            boxShadow: '0 0 10px #00ffff'
          }}
        />
      ))}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 1,
            opacity: 1
          }}
          animate={{
            x: particle.x + particle.vx * 40,
            y: particle.y + particle.vy * 40,
            scale: 0,
            opacity: 0
          }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`
          }}
        />
      ))}
    </div>
  );

  const renderMatrixExplosion = () => (
    <div className="absolute inset-0 pointer-events-none">
      {/* Digital explosion effect */}
      <motion.div
        className="absolute inset-0 font-mono text-green-400"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute text-lg font-bold"
            initial={{
              x: (position?.x || 150) + (Math.random() - 0.5) * 50,
              y: (position?.y || 300) + (Math.random() - 0.5) * 50,
              scale: 1,
              opacity: 1
            }}
            animate={{
              x: (position?.x || 150) + (Math.random() - 0.5) * 200,
              y: (position?.y || 300) + (Math.random() - 0.5) * 200,
              scale: 0,
              opacity: 0
            }}
            transition={{ duration: 1.2, delay: i * 0.05 }}
            style={{
              textShadow: '0 0 10px #00ff00'
            }}
          >
            {Math.random() > 0.5 ? '1' : '0'}
          </motion.div>
        ))}
      </motion.div>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute font-mono text-green-400 font-bold"
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 1,
            opacity: 1
          }}
          animate={{
            x: particle.x + particle.vx * 60,
            y: particle.y + particle.vy * 60,
            scale: 0,
            opacity: 0
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            fontSize: particle.size + 'px',
            textShadow: '0 0 5px #00ff00'
          }}
        >
          {Math.random() > 0.5 ? '1' : '0'}
        </motion.div>
      ))}
    </div>
  );

  const renderRainbowExplosion = () => (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #0000ff, #8800ff, #ff0000)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '120px',
          height: '120px'
        }}
      />
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 1,
            opacity: 1,
            rotate: 0
          }}
          animate={{
            x: particle.x + particle.vx * 45,
            y: particle.y + particle.vy * 45,
            scale: 0,
            opacity: 0,
            rotate: 360
          }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
          }}
        />
      ))}
    </div>
  );

  const renderDefaultExplosion = () => (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0 rounded-full bg-white"
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100px',
          height: '100px'
        }}
      />
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          initial={{
            x: particle.x,
            y: particle.y,
            scale: 1,
            opacity: 1
          }}
          animate={{
            x: particle.x + particle.vx * 40,
            y: particle.y + particle.vy * 40,
            scale: 0,
            opacity: 0
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color
          }}
        />
      ))}
    </div>
  );

  if (!showExplosion || linesCleared === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 pointer-events-none z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {effect === 'fire' && renderFireExplosion()}
        {effect === 'ice' && renderIceExplosion()}
        {effect === 'electric' && renderElectricExplosion()}
        {effect === 'matrix' && renderMatrixExplosion()}
        {effect === 'rainbow' && renderRainbowExplosion()}
        {(!effect || effect === 'none') && renderDefaultExplosion()}
      </motion.div>
    </AnimatePresence>
  );
};

export default ParticleEffects;
