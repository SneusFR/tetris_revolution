import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEdit, FaCamera, FaTrophy, FaGamepad, FaClock, 
  FaArrowLeft, FaSave, FaTimes, FaUpload, FaFlag, FaStar,
  FaChartLine, FaFire, FaBullseye, FaMedal, FaImage
} from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import useBannerStore from '../store/bannerStore';
import BannerDisplay from './BannerDisplay';

const Profile = ({ onBack }) => {
  const { user, updateUserProfile, uploadAvatar, isLoading } = useAuthStore();
  const { 
    banners, 
    currentBanner, 
    fetchBanners, 
    selectBanner,
    isLoading: bannersLoading 
  } = useBannerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [editData, setEditData] = useState({
    country: user?.profile?.country || 'FR',
    title: user?.profile?.title || ''
  });
  
  const avatarInputRef = useRef(null);

  // Charger les bannières au montage du composant
  React.useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const countries = [
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
    { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
    { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
    { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
    { code: 'IT', name: 'Italie', flag: '🇮🇹' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'JP', name: 'Japon', flag: '🇯🇵' },
    { code: 'KR', name: 'Corée du Sud', flag: '🇰🇷' },
    { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  ];

  const handleSave = async () => {
    const result = await updateUserProfile(editData);
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      country: user?.profile?.country || 'FR',
      title: user?.profile?.title || ''
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadBanner(file);
    }
  };

  const getCountryInfo = (code) => {
    return countries.find(c => c.code === code) || { name: code, flag: '🌍' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      {/* Bouton retour */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 z-50 p-3 rounded-lg glass-effect hover:bg-white/20 transition-colors flex items-center gap-2"
      >
        <FaArrowLeft className="text-xl" />
        <span>Menu</span>
      </button>

      <div className="max-w-4xl mx-auto pt-16">
        {/* Bannière et avatar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          {/* Bannière */}
          <div className="relative h-48 rounded-2xl overflow-hidden glass-effect">
            <BannerDisplay 
              banner={currentBanner || { 
                id: 'default', 
                name: 'Défaut', 
                type: 'gradient', 
                config: { 
                  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                } 
              }} 
              className="w-full h-full" 
            />
            
            {/* Bouton sélection bannière */}
            <button
              onClick={() => setShowBannerSelector(true)}
              className="absolute top-4 right-4 p-2 rounded-lg glass-effect hover:bg-white/20 transition-colors"
              disabled={isLoading}
            >
              <FaImage className="text-lg" />
            </button>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden glass-effect">
                {user.profile?.avatar ? (
                  <img
                    src={`http://localhost:5000${user.profile.avatar}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                    <FaUser className="text-4xl text-white" />
                  </div>
                )}
              </div>
              
              {/* Bouton upload avatar */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 rounded-full glass-effect hover:bg-white/20 transition-colors"
                disabled={isLoading}
              >
                <FaCamera className="text-sm" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>
        </motion.div>

        {/* Informations utilisateur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ml-8 mb-8 pt-16"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
                {user.username}
              </h1>
              
              {isEditing ? (
                <div className="flex items-center gap-4 mt-2">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Votre titre personnalisé"
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-neon-blue text-sm"
                    maxLength={50}
                  />
                  <select
                    value={editData.country}
                    onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-neon-blue text-sm"
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.code} className="bg-gray-800">
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-400">
                    {user.profile?.title || 'Joueur Tetris'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{getCountryInfo(user.profile?.country).flag}</span>
                    <span>{getCountryInfo(user.profile?.country).name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Boutons d'édition */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="p-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 transition-colors flex items-center gap-2"
                  >
                    <FaSave />
                    <span>Sauvegarder</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 transition-colors flex items-center gap-2"
                  >
                    <FaTimes />
                    <span>Annuler</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-3 rounded-lg glass-effect hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <FaEdit />
                  <span>Modifier</span>
                </button>
              )}
            </div>
          </div>

          {/* Niveau et expérience */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <FaStar className="text-neon-yellow" />
              <span className="text-2xl font-bold">Niveau {user.profile?.level || 1}</span>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Expérience</span>
                <span>{(user.profile?.experience || 0).toLocaleString()} XP</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, ((user.profile?.experience || 0) % 1000) / 10)}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Informations de compte */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <FaClock />
              <span>Membre depuis le {formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaGamepad />
              <span>Dernière connexion: {formatDate(user.lastLogin)}</span>
            </div>
          </div>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Meilleur score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600">
                <FaTrophy className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Meilleur Score</p>
                <p className="text-2xl font-bold text-neon-yellow">
                  {(user.gameStats?.bestScore || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Parties jouées */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600">
                <FaGamepad className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Parties Jouées</p>
                <p className="text-2xl font-bold text-neon-blue">
                  {(user.gameStats?.totalGames || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Lignes effacées */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-effect rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-green-600">
                <FaBullseye className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Lignes Effacées</p>
                <p className="text-2xl font-bold text-neon-green">
                  {(user.gameStats?.totalLinesCleared || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Temps de jeu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-effect rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600">
                <FaClock className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Temps de Jeu</p>
                <p className="text-2xl font-bold text-neon-purple">
                  {formatTime(user.gameStats?.totalTimePlayed || 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Statistiques détaillées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-effect rounded-xl p-6 mb-8"
        >
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FaChartLine className="text-neon-blue" />
            Statistiques Détaillées
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Score Total</p>
              <p className="text-xl font-bold">
                {(user.gameStats?.totalScore || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Score Moyen</p>
              <p className="text-xl font-bold">
                {(user.gameStats?.averageScore || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Taux de Victoire</p>
              <p className="text-xl font-bold">
                {user.gameStats?.winRate || 0}%
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Victoires</p>
              <p className="text-xl font-bold text-green-400">
                {(user.gameStats?.totalWins || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Défaites</p>
              <p className="text-xl font-bold text-red-400">
                {(user.gameStats?.totalLosses || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Classement</p>
              <div className="flex items-center gap-2">
                <FaMedal className="text-neon-yellow" />
                <p className="text-xl font-bold">
                  #{user.ranking?.currentRank || 'Non classé'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Parties récentes */}
        {user.recentGames && user.recentGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-effect rounded-xl p-6"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaFire className="text-neon-orange" />
              Parties Récentes
            </h3>

            <div className="space-y-3">
              {user.recentGames.slice(0, 5).map((game, index) => (
                <div key={game._id || index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{game.score.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{game.level}</p>
                      <p className="text-xs text-gray-400">Niveau</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{game.linesCleared}</p>
                      <p className="text-xs text-gray-400">Lignes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm capitalize">{game.gameMode}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(game.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de sélection de bannière */}
      <AnimatePresence>
        {showBannerSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBannerSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-effect rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Choisir une bannière</h3>
                <button
                  onClick={() => setShowBannerSelector(false)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.filter(banner => banner.isOwned).map((banner) => (
                  <motion.div
                    key={banner.id}
                    className={`
                      relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                      ${currentBanner?.id === banner.id 
                        ? 'border-orange-500 ring-2 ring-orange-500/50' 
                        : 'border-white/20 hover:border-white/40'}
                    `}
                    onClick={async () => {
                      if (!bannersLoading) {
                        await selectBanner(banner.id);
                        setShowBannerSelector(false);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {currentBanner?.id === banner.id && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                        ACTIF
                      </div>
                    )}
                    
                    <div className="h-24">
                      <BannerDisplay banner={banner} className="w-full h-full" />
                    </div>
                    
                    <div className="p-3 bg-black/20">
                      <h4 className="font-bold">{banner.name}</h4>
                      <p className="text-sm text-gray-400">
                        {banner.type === 'gradient' && 'Bannière avec dégradé simple'}
                        {banner.type === 'tetris' && 'Pièces de Tetris qui tombent'}
                        {banner.type === 'grid' && 'Grille néon avec pulsation'}
                        {banner.type === 'particles' && 'Particules animées'}
                        {banner.type === 'wave' && 'Vagues colorées'}
                        {banner.type === 'matrix' && 'Effet Matrix'}
                        {banner.type === 'fire' && 'Flammes animées'}
                        {banner.type === 'circuit' && 'Circuits électroniques'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {banners.filter(banner => banner.isOwned).length === 0 && (
                <div className="text-center py-8">
                  <FaImage className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Vous n'avez aucune bannière</p>
                  <p className="text-sm text-gray-500">
                    Visitez la boutique pour acheter des bannières avec vos crédits !
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
