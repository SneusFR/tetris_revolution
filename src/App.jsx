import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MainMenu from './components/MainMenu';
import TetrisGame from './components/TetrisGame';
import Settings from './components/Settings';
import Shop from './components/Shop';
import Statistics from './components/Statistics';
import Auth from './components/Auth';
import Profile from './components/Profile';
import soundManager from './utils/soundManager';
import { FaArrowLeft } from 'react-icons/fa';

function App() {
  const [currentView, setCurrentView] = useState('menu');

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleBack = () => {
    // Arrêter la musique quand on quitte le jeu
    soundManager.stopMusic();
    setCurrentView('menu');
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.95
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 overflow-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'menu' && (
          <motion.div
            key="menu"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <MainMenu onNavigate={handleNavigate} />
          </motion.div>
        )}

        {currentView === 'game' && (
          <motion.div
            key="game"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative"
          >
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 z-50 p-3 rounded-lg glass-effect hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <FaArrowLeft className="text-xl" />
              <span>Menu</span>
            </button>
            <div className="flex items-center justify-center min-h-screen">
              <TetrisGame />
            </div>
          </motion.div>
        )}

        {currentView === 'settings' && (
          <motion.div
            key="settings"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Settings onBack={handleBack} />
          </motion.div>
        )}

        {currentView === 'shop' && (
          <motion.div
            key="shop"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Shop onBack={handleBack} />
          </motion.div>
        )}

        {currentView === 'stats' && (
          <motion.div
            key="stats"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Statistics onBack={handleBack} />
          </motion.div>
        )}

        {currentView === 'auth' && (
          <motion.div
            key="auth"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Auth onBack={handleBack} />
          </motion.div>
        )}

        {currentView === 'profile' && (
          <motion.div
            key="profile"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Profile onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Background Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 20 + Math.random() * 20,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
