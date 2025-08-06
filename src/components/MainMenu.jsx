import React from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaCog, FaShoppingCart, FaTrophy, FaInfoCircle } from 'react-icons/fa';
import useGameStore from '../store/gameStore';

const MainMenu = ({ onNavigate }) => {
  const { highScore, credits, statistics } = useGameStore();

  const menuItems = [
    {
      icon: <FaPlay className="text-2xl" />,
      title: 'Jouer',
      description: 'Commencer une nouvelle partie',
      color: 'from-green-400 to-green-600',
      action: () => onNavigate('game')
    },
    {
      icon: <FaCog className="text-2xl" />,
      title: 'Paramètres',
      description: 'Configurer le jeu',
      color: 'from-blue-400 to-blue-600',
      action: () => onNavigate('settings')
    },
    {
      icon: <FaShoppingCart className="text-2xl" />,
      title: 'Boutique',
      description: 'Acheter des thèmes et effets',
      color: 'from-purple-400 to-purple-600',
      action: () => onNavigate('shop')
    },
    {
      icon: <FaTrophy className="text-2xl" />,
      title: 'Statistiques',
      description: 'Voir vos performances',
      color: 'from-yellow-400 to-yellow-600',
      action: () => onNavigate('stats')
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center -mt-30"
      >
        <img 
          src="/src/assets/logo.png" 
          alt="Logo" 
          className="mx-auto h-80 w-auto object-contain drop-shadow-2xl"
        />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center -mt-30"
      >
        <h1 className="text-8xl font-black -mb-4 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent neon-text">
          TETRIS
        </h1>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-8 mb-6 -mt-4"
      >
        <div className="glass-effect px-6 py-3 rounded-lg">
          <p className="text-sm text-gray-400">Meilleur Score</p>
          <p className="text-2xl font-bold text-neon-blue">{highScore.toLocaleString()}</p>
        </div>
        <div className="glass-effect px-6 py-3 rounded-lg">
          <p className="text-sm text-gray-400">Crédits</p>
          <p className="text-2xl font-bold text-neon-yellow">{credits.toLocaleString()} ¢</p>
        </div>
        <div className="glass-effect px-6 py-3 rounded-lg">
          <p className="text-sm text-gray-400">Parties Jouées</p>
          <p className="text-2xl font-bold text-neon-green">{statistics.totalGamesPlayed}</p>
        </div>
      </motion.div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-6 max-w-4xl w-full">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.title}
            initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={item.action}
            className="group relative overflow-hidden rounded-xl p-8 glass-effect hover:shadow-2xl transition-all duration-300"
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-4 rounded-lg bg-gradient-to-br ${item.color} text-white shadow-lg`}>
                {item.icon}
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white mb-1">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
          </motion.button>
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center text-gray-500"
      >
        <p className="flex items-center gap-2">
          <FaInfoCircle />
          <span>Utilisez les flèches pour naviguer • ENTER pour sélectionner</span>
        </p>
      </motion.div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 border-2 border-neon-blue opacity-10"
            initial={{
              x: Math.random() * window.innerWidth,
              y: -150,
              rotate: Math.random() * 360
            }}
            animate={{
              y: window.innerHeight + 150,
              rotate: Math.random() * 360
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 2,
              ease: "linear"
            }}
            style={{
              borderColor: ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff8800'][i]
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
