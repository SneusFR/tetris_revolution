import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaPalette, FaStar, FaCoins, FaCheck, FaLock } from 'react-icons/fa';
import useGameStore from '../store/gameStore';

const Shop = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('themes');
  const {
    credits,
    themes,
    effects,
    currentTheme,
    currentEffect,
    purchaseTheme,
    purchaseEffect,
    setCurrentTheme,
    setCurrentEffect,
    _migrate
  } = useGameStore();

  // Run migration on component mount to ensure new themes are available
  React.useEffect(() => {
    if (_migrate) {
      _migrate();
    }
  }, [_migrate]);

  const handlePurchaseTheme = (themeId) => {
    purchaseTheme(themeId);
  };

  const handlePurchaseEffect = (effectId) => {
    purchaseEffect(effectId);
  };

  const handleSelectTheme = (themeId) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme && theme.owned) {
      setCurrentTheme(themeId);
    }
  };

  const handleSelectEffect = (effectId) => {
    const effect = effects.find(e => e.id === effectId);
    if (effect && effect.owned) {
      setCurrentEffect(effectId);
    }
  };

  const tabs = [
    { id: 'themes', label: 'Thèmes', icon: <FaPalette /> },
    { id: 'effects', label: 'Effets', icon: <FaStar /> }
  ];

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 rounded-lg glass-effect hover:bg-white/20 transition-colors"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-4xl font-bold">Boutique</h1>
        </div>
        
        {/* Credits Display */}
        <motion.div
          className="flex items-center gap-2 px-6 py-3 rounded-lg glass-effect"
          whileHover={{ scale: 1.05 }}
        >
          <FaCoins className="text-yellow-400 text-xl" />
          <span className="text-2xl font-bold">{credits.toLocaleString()}</span>
          <span className="text-gray-400">crédits</span>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
              ${activeTab === tab.id 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'glass-effect hover:bg-white/20'}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'themes' && (
          <motion.div
            key="themes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-3 gap-6"
          >
            {themes.map((theme, index) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  card p-6 relative overflow-hidden cursor-pointer transition-all
                  ${theme.owned ? 'hover:shadow-2xl' : 'opacity-90'}
                  ${currentTheme === theme.id ? 'ring-4 ring-blue-500' : ''}
                `}
                onClick={() => theme.owned && handleSelectTheme(theme.id)}
              >
                {/* Selected Badge */}
                {currentTheme === theme.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    ACTIF
                  </div>
                )}

                {/* Theme Preview */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-3">{theme.name}</h3>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {theme.colors.map((color, i) => (
                      <motion.div
                        key={i}
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + i * 0.05 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Price / Status */}
                <div className="flex items-center justify-between">
                  {theme.owned ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <FaCheck />
                      <span className="font-semibold">Possédé</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <FaCoins className="text-yellow-400" />
                        <span className="text-xl font-bold">{theme.price}</span>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchaseTheme(theme.id);
                        }}
                        disabled={credits < theme.price}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all
                          ${credits >= theme.price
                            ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                        `}
                        whileHover={credits >= theme.price ? { scale: 1.05 } : {}}
                        whileTap={credits >= theme.price ? { scale: 0.95 } : {}}
                      >
                        {credits >= theme.price ? 'Acheter' : <FaLock />}
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'effects' && (
          <motion.div
            key="effects"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-3 gap-6"
          >
            {effects.map((effect, index) => (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  card p-6 relative overflow-hidden cursor-pointer transition-all
                  ${effect.owned ? 'hover:shadow-2xl' : 'opacity-90'}
                  ${currentEffect === effect.id ? 'ring-4 ring-purple-500' : ''}
                `}
                onClick={() => effect.owned && handleSelectEffect(effect.id)}
              >
                {/* Selected Badge */}
                {currentEffect === effect.id && (
                  <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    ACTIF
                  </div>
                )}

                {/* Effect Preview */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`
                      p-3 rounded-lg
                      ${effect.id === 'rainbow' ? 'bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500' : ''}
                      ${effect.id === 'fire' ? 'bg-gradient-to-br from-red-500 to-orange-500' : ''}
                      ${effect.id === 'ice' ? 'bg-gradient-to-br from-blue-300 to-blue-600' : ''}
                      ${effect.id === 'electric' ? 'bg-gradient-to-br from-yellow-300 to-yellow-600' : ''}
                      ${effect.id === 'matrix' ? 'bg-gradient-to-br from-green-400 to-green-700' : ''}
                      ${effect.id === 'none' ? 'bg-gray-600' : ''}
                    `}>
                      <FaStar className="text-white text-xl" />
                    </div>
                    <h3 className="text-xl font-bold">{effect.name}</h3>
                  </div>
                  
                  {/* Effect Description */}
                  <p className="text-gray-400 text-sm">
                    {effect.id === 'rainbow' && 'Effet arc-en-ciel animé sur les blocs'}
                    {effect.id === 'fire' && 'Les blocs brûlent avec des flammes'}
                    {effect.id === 'ice' && 'Effet de glace cristalline'}
                    {effect.id === 'electric' && 'Éclairs électriques sur les blocs'}
                    {effect.id === 'matrix' && 'Effet Matrix avec chute de code'}
                    {effect.id === 'none' && 'Aucun effet visuel supplémentaire'}
                  </p>
                </div>

                {/* Price / Status */}
                <div className="flex items-center justify-between">
                  {effect.owned ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <FaCheck />
                      <span className="font-semibold">Possédé</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <FaCoins className="text-yellow-400" />
                        <span className="text-xl font-bold">{effect.price}</span>
                      </div>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchaseEffect(effect.id);
                        }}
                        disabled={credits < effect.price}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all
                          ${credits >= effect.price
                            ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:shadow-lg'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                        `}
                        whileHover={credits >= effect.price ? { scale: 1.05 } : {}}
                        whileTap={credits >= effect.price ? { scale: 0.95 } : {}}
                      >
                        {credits >= effect.price ? 'Acheter' : <FaLock />}
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-4 rounded-lg glass-effect text-center"
      >
        <p className="text-gray-400">
          💡 Astuce: Gagnez des crédits en jouant! Vous recevez 1 crédit pour chaque 10 points marqués.
        </p>
      </motion.div>
    </div>
  );
};

export default Shop;
