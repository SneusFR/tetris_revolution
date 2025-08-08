import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaPalette, FaStar, FaCoins, FaCheck, FaLock, FaImage, FaTrophy, FaGamepad, FaChartLine, FaLayerGroup } from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import useBannerStore from '../store/bannerStore';
import useThemeStore from '../store/themeStore';
import useEffectStore from '../store/effectStore';
import BannerDisplay from './BannerDisplay';

const Shop = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('themes');

  const { user } = useAuthStore();
  const credits = user?.profile?.credits || 0;

  // Stores pour chaque type d'item
  const {
    banners,
    currentBanner,
    isLoading: bannersLoading,
    error: bannersError,
    fetchBanners,
    purchaseBanner,
    selectBanner,
    clearError: clearBannerError
  } = useBannerStore();

  const {
    themes,
    currentTheme,
    isLoading: themesLoading,
    error: themesError,
    fetchThemes,
    purchaseTheme,
    selectTheme,
    clearError: clearThemeError
  } = useThemeStore();

  const {
    effects,
    currentEffect,
    isLoading: effectsLoading,
    error: effectsError,
    fetchEffects,
    purchaseEffect,
    selectEffect,
    clearError: clearEffectError
  } = useEffectStore();

  // Charger les données au montage du composant
  React.useEffect(() => {
    // Ajouter des délais pour éviter les appels simultanés
    const loadData = async () => {
      try {
        await fetchBanners();
        // Petit délai entre chaque appel
        await new Promise(resolve => setTimeout(resolve, 200));
        await fetchThemes();
        await new Promise(resolve => setTimeout(resolve, 200));
        await fetchEffects();
      } catch (error) {
        console.warn('Erreur lors du chargement des données de la boutique:', error);
      }
    };
    
    loadData();
  }, [fetchBanners, fetchThemes, fetchEffects]);

  const handlePurchaseTheme = async (themeId) => {
    const result = await purchaseTheme(themeId);
    if (!result.success) {
      console.error('Erreur lors de l\'achat du thème:', result.error);
    }
  };

  const handlePurchaseEffect = async (effectId) => {
    const result = await purchaseEffect(effectId);
    if (!result.success) {
      console.error('Erreur lors de l\'achat de l\'effet:', result.error);
    }
  };

  const handleSelectTheme = async (themeId) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme && theme.isOwned) {
      const result = await selectTheme(themeId);
      if (!result.success) {
        console.error('Erreur lors de la sélection du thème:', result.error);
      }
    }
  };

  const handleSelectEffect = async (effectId) => {
    const effect = effects.find(e => e.id === effectId);
    if (effect && effect.isOwned) {
      const result = await selectEffect(effectId);
      if (!result.success) {
        console.error('Erreur lors de la sélection de l\'effet:', result.error);
      }
    }
  };

  const handlePurchaseBanner = (bannerId) => {
    purchaseBanner(bannerId);
  };

  const handleSelectBanner = async (bannerId) => {
    const banner = banners.find(b => b.id === bannerId);
    if (banner && banner.isOwned) {
      const result = await selectBanner(bannerId);
      if (!result.success) {
        console.error('Erreur lors de la sélection de la bannière:', result.error);
      }
    }
  };

  const handlePurchaseBannerWithFeedback = async (bannerId) => {
    const result = await purchaseBanner(bannerId);
    if (!result.success) {
      console.error('Erreur lors de l\'achat de la bannière:', result.error);
    }
  };

  // Définir les conditions de déblocage des bannières
  const getBannerUnlockConditions = (bannerId) => {
    const conditions = {
      'default': { type: 'none', description: 'Toujours disponible', icon: <FaCheck />, color: 'text-green-400' },
      'tetris_classic': { type: 'none', description: 'Toujours disponible', icon: <FaCheck />, color: 'text-green-400' },
      'neon_grid': { 
        type: 'score', 
        description: 'Score ≥ 50,000', 
        requirement: 50000,
        icon: <FaTrophy />, 
        color: 'text-yellow-400',
        statKey: 'bestScore'
      },
      'particle_storm': { 
        type: 'lines', 
        description: 'Lignes ≥ 500', 
        requirement: 500,
        icon: <FaLayerGroup />, 
        color: 'text-blue-400',
        statKey: 'totalLinesCleared'
      },
      'rainbow_wave': { 
        type: 'level', 
        description: 'Niveau ≥ 15', 
        requirement: 15,
        icon: <FaChartLine />, 
        color: 'text-purple-400',
        statKey: 'level'
      },
      'matrix_rain': { 
        type: 'games', 
        description: 'Parties ≥ 100', 
        requirement: 100,
        icon: <FaGamepad />, 
        color: 'text-green-400',
        statKey: 'totalGames'
      },
      'fire_storm': { 
        type: 'score', 
        description: 'Score ≥ 100,000', 
        requirement: 100000,
        icon: <FaTrophy />, 
        color: 'text-red-400',
        statKey: 'bestScore'
      },
      'cyber_circuit': { 
        type: 'rank', 
        description: 'Rang ≤ 10', 
        requirement: 10,
        icon: <FaStar />, 
        color: 'text-cyan-400',
        statKey: 'bestRank'
      }
    };
    
    return conditions[bannerId] || conditions['default'];
  };

  // Vérifier si une bannière peut être débloquée
  const canUnlockBanner = (bannerId) => {
    const condition = getBannerUnlockConditions(bannerId);
    if (condition.type === 'none') return true;
    
    let currentValue = 0;
    
    // Récupérer la valeur selon le type de condition
    switch (condition.type) {
      case 'score':
        currentValue = user?.gameStats?.bestScore || 0;
        break;
      case 'lines':
        currentValue = user?.gameStats?.totalLinesCleared || 0;
        break;
      case 'level':
        currentValue = user?.profile?.level || 0;
        break;
      case 'games':
        currentValue = user?.gameStats?.totalGames || 0;
        break;
      case 'rank':
        currentValue = user?.ranking?.bestRank || 0;
        break;
      default:
        return false;
    }
    
    if (condition.type === 'rank') {
      // Pour le rang, on vérifie si le rang est <= à la condition (plus petit = meilleur)
      return currentValue > 0 && currentValue <= condition.requirement;
    } else {
      // Pour les autres stats, on vérifie si la valeur est >= à la condition
      return currentValue >= condition.requirement;
    }
  };

  // Obtenir le statut de progression pour une bannière
  const getBannerProgress = (bannerId) => {
    const condition = getBannerUnlockConditions(bannerId);
    if (condition.type === 'none') return { current: 1, required: 1, percentage: 100 };
    
    let currentValue = 0;
    
    // Récupérer la valeur selon le type de condition
    switch (condition.type) {
      case 'score':
        currentValue = user?.gameStats?.bestScore || 0;
        break;
      case 'lines':
        currentValue = user?.gameStats?.totalLinesCleared || 0;
        break;
      case 'level':
        currentValue = user?.profile?.level || 0;
        break;
      case 'games':
        currentValue = user?.gameStats?.totalGames || 0;
        break;
      case 'rank':
        currentValue = user?.ranking?.bestRank || 0;
        break;
      default:
        currentValue = 0;
    }
    
    if (condition.type === 'rank') {
      if (currentValue === 0) return { current: 0, required: condition.requirement, percentage: 0 };
      return { 
        current: currentValue, 
        required: condition.requirement, 
        percentage: currentValue <= condition.requirement ? 100 : 0 
      };
    } else {
      const percentage = Math.min((currentValue / condition.requirement) * 100, 100);
      return { current: currentValue, required: condition.requirement, percentage };
    }
  };

  const tabs = [
    { id: 'themes', label: 'Thèmes', icon: <FaPalette /> },
    { id: 'effects', label: 'Effets', icon: <FaStar /> },
    { id: 'banners', label: 'Bannières', icon: <FaImage /> }
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
                  ${theme.isOwned ? 'hover:shadow-2xl' : 'opacity-90'}
                  ${currentTheme?.id === theme.id ? 'ring-4 ring-blue-500' : ''}
                `}
                onClick={() => theme.isOwned && handleSelectTheme(theme.id)}
              >
                {/* Selected Badge */}
                {currentTheme?.id === theme.id && (
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
                  {theme.isOwned ? (
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
                  ${effect.isOwned ? 'hover:shadow-2xl' : 'opacity-90'}
                  ${currentEffect?.id === effect.id ? 'ring-4 ring-purple-500' : ''}
                `}
                onClick={() => effect.isOwned && handleSelectEffect(effect.id)}
              >
                {/* Selected Badge */}
                {currentEffect?.id === effect.id && (
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
                  {effect.isOwned ? (
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

        {activeTab === 'banners' && (
          <motion.div
            key="banners"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-2 gap-6"
          >
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  card p-6 relative overflow-hidden cursor-pointer transition-all
                  ${banner.isOwned ? 'hover:shadow-2xl' : 'opacity-90'}
                  ${currentBanner?.id === banner.id ? 'ring-4 ring-orange-500' : ''}
                `}
                onClick={() => banner.isOwned && handleSelectBanner(banner.id)}
              >
                {/* Selected Badge */}
                {currentBanner?.id === banner.id && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                    ACTIF
                  </div>
                )}

                {/* Banner Preview */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-3">{banner.name}</h3>
                  <div className="h-24 rounded-lg overflow-hidden border border-white/20">
                    <BannerDisplay banner={banner} className="w-full h-full" />
                  </div>
                  
                  {/* Banner Description */}
                  <p className="text-gray-400 text-sm mt-2">
                    {banner.type === 'gradient' && 'Bannière avec dégradé simple'}
                    {banner.type === 'tetris' && 'Pièces de Tetris qui tombent en animation'}
                    {banner.type === 'grid' && 'Grille néon avec effet de pulsation'}
                    {banner.type === 'particles' && 'Particules animées en mouvement'}
                    {banner.type === 'wave' && 'Vagues colorées en mouvement'}
                    {banner.type === 'matrix' && 'Effet Matrix avec caractères qui tombent'}
                    {banner.type === 'fire' && 'Flammes animées avec effet de feu'}
                    {banner.type === 'circuit' && 'Circuits électroniques avec pulsations'}
                  </p>

                  {/* Unlock Conditions */}
                  {!banner.isOwned && (() => {
                    const condition = getBannerUnlockConditions(banner.id);
                    const progress = getBannerProgress(banner.id);
                    const canUnlock = canUnlockBanner(banner.id);
                    
                    return (
                      <div className="mt-3 p-3 rounded-lg bg-black/30 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${condition.color}`}>
                            {condition.icon}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            Condition de déblocage
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">
                            {condition.description}
                          </span>
                          <span className={`text-sm font-bold ${canUnlock ? 'text-green-400' : 'text-red-400'}`}>
                            {canUnlock ? '✓ Débloquée' : '✗ Verrouillée'}
                          </span>
                        </div>

                        {condition.type !== 'none' && (
                          <>
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  progress.percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                              />
                            </div>
                            
                            {/* Progress Text */}
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>
                                {condition.type === 'rank' 
                                  ? `Rang actuel: ${progress.current || 'Non classé'}`
                                  : `Actuel: ${progress.current.toLocaleString()}`
                                }
                              </span>
                              <span>
                                {condition.type === 'rank'
                                  ? `Requis: ≤ ${progress.required}`
                                  : `Requis: ${progress.required.toLocaleString()}`
                                }
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Price / Status */}
                <div className="flex items-center justify-between">
                  {banner.isOwned ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <FaCheck />
                      <span className="font-semibold">Possédé</span>
                    </div>
                  ) : (() => {
                    const canUnlock = canUnlockBanner(banner.id);
                    const canAfford = credits >= banner.price;
                    const canPurchase = canUnlock && canAfford && !bannersLoading;
                    
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <FaCoins className="text-yellow-400" />
                          <span className="text-xl font-bold">{banner.price}</span>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canPurchase) {
                              handlePurchaseBannerWithFeedback(banner.id);
                            }
                          }}
                          disabled={!canPurchase}
                          className={`
                            px-4 py-2 rounded-lg font-semibold transition-all
                            ${canPurchase
                              ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:shadow-lg'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'}
                          `}
                          whileHover={canPurchase ? { scale: 1.05 } : {}}
                          whileTap={canPurchase ? { scale: 0.95 } : {}}
                          title={
                            !canUnlock ? 'Condition de déblocage non remplie' :
                            !canAfford ? 'Crédits insuffisants' :
                            bannersLoading ? 'Chargement...' : 'Acheter cette bannière'
                          }
                        >
                          {bannersLoading ? '...' : 
                           !canUnlock ? <FaLock /> :
                           !canAfford ? <FaLock /> : 
                           'Acheter'}
                        </motion.button>
                      </>
                    );
                  })()}
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
