import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaTrophy, FaCrown, FaMedal, FaFlag, FaUser, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import BannerDisplay from './BannerDisplay';

const Leaderboard = ({ onBack }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRank, setUserRank] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { user } = useAuthStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.getLeaderboard('global', { 
        page: currentPage, 
        limit: 20 
      });
      
      if (response) {
        setLeaderboardData(response.leaderboard || []);
        setUserRank(response.userRank);
        setTotalPages(response.pagination?.total || 1);
      }
    } catch (err) {
      setError('Erreur lors du chargement du leaderboard');
      console.error('Erreur leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return {
          gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
          shadow: 'shadow-yellow-500/50',
          glow: 'drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]',
          border: 'border-yellow-400',
          icon: '👑'
        };
      case 2:
        return {
          gradient: 'from-gray-300 via-gray-400 to-gray-500',
          shadow: 'shadow-gray-400/50',
          glow: 'drop-shadow-[0_0_15px_rgba(156,163,175,0.8)]',
          border: 'border-gray-400',
          icon: '🥈'
        };
      case 3:
        return {
          gradient: 'from-amber-600 via-amber-700 to-amber-800',
          shadow: 'shadow-amber-600/50',
          glow: 'drop-shadow-[0_0_15px_rgba(217,119,6,0.8)]',
          border: 'border-amber-600',
          icon: '🥉'
        };
      default:
        return {
          gradient: 'from-gray-700 via-gray-800 to-gray-900',
          shadow: 'shadow-gray-700/30',
          glow: '',
          border: 'border-gray-600',
          icon: ''
        };
    }
  };

  const formatScore = (score) => {
    return score?.toLocaleString() || '0';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌ {error}</div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
          🏆 LEADERBOARD 🏆
        </h1>
        <p className="text-gray-300 text-lg">
          Les meilleurs joueurs de Tetris Revolution
        </p>
        {userRank && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
          >
            <span className="text-white font-semibold">
              Votre rang: #{userRank}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Podium pour les 3 premiers */}
      {leaderboardData.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center items-end mb-12 space-x-4"
        >
          {/* 2ème place */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <div className="relative">
              <div className={`w-24 h-32 bg-gradient-to-t ${getRankStyle(2).gradient} rounded-t-lg ${getRankStyle(2).shadow} shadow-2xl mb-4 flex items-end justify-center pb-2`}>
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-4 ${getRankStyle(2).border} overflow-hidden ${getRankStyle(2).glow}`}>
                {leaderboardData[1]?.profile?.avatar ? (
                  <img
                    src={`http://localhost:5000${leaderboardData[1].profile.avatar}`}
                    alt={leaderboardData[1].username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
              </div>
            </div>
            <div className="text-white font-bold">{leaderboardData[1]?.username}</div>
            <div className="text-gray-300">{formatScore(leaderboardData[1]?.gameStats?.bestScore)}</div>
          </motion.div>

          {/* 1ère place */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <div className="relative">
              <div className={`w-28 h-40 bg-gradient-to-t ${getRankStyle(1).gradient} rounded-t-lg ${getRankStyle(1).shadow} shadow-2xl mb-4 flex items-end justify-center pb-2`}>
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <div className={`absolute -top-6 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full border-4 ${getRankStyle(1).border} overflow-hidden ${getRankStyle(1).glow}`}>
                {leaderboardData[0]?.profile?.avatar ? (
                  <img
                    src={`http://localhost:5000${leaderboardData[0].profile.avatar}`}
                    alt={leaderboardData[0].username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
              </div>
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-3xl animate-bounce">
                👑
              </div>
            </div>
            <div className="text-white font-bold text-lg">{leaderboardData[0]?.username}</div>
            <div className="text-yellow-400 font-bold">{formatScore(leaderboardData[0]?.gameStats?.bestScore)}</div>
          </motion.div>

          {/* 3ème place */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="relative">
              <div className={`w-20 h-24 bg-gradient-to-t ${getRankStyle(3).gradient} rounded-t-lg ${getRankStyle(3).shadow} shadow-2xl mb-4 flex items-end justify-center pb-2`}>
                <span className="text-white font-bold">3</span>
              </div>
              <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-14 h-14 rounded-full border-4 ${getRankStyle(3).border} overflow-hidden ${getRankStyle(3).glow}`}>
                {leaderboardData[2]?.profile?.avatar ? (
                  <img
                    src={`http://localhost:5000${leaderboardData[2].profile.avatar}`}
                    alt={leaderboardData[2].username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xl">
                    👤
                  </div>
                )}
              </div>
            </div>
            <div className="text-white font-bold">{leaderboardData[2]?.username}</div>
            <div className="text-gray-300">{formatScore(leaderboardData[2]?.gameStats?.bestScore)}</div>
          </motion.div>
        </motion.div>
      )}

      {/* Liste complète */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence>
          {leaderboardData.map((entry, index) => (
            <motion.div
              key={entry._id || entry.id}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`mb-4 relative overflow-hidden rounded-xl ${
                entry.rank <= 3 ? 'ring-2 ring-opacity-50' : ''
              } ${
                entry.rank === 1 ? 'ring-yellow-400' :
                entry.rank === 2 ? 'ring-gray-400' :
                entry.rank === 3 ? 'ring-amber-600' : ''
              }`}
            >
              {/* Bannière en arrière-plan */}
              <div className="absolute inset-0 opacity-30">
                <BannerDisplay 
                  bannerId={entry.profile?.banner || 'default'} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Contenu de la card */}
              <div className="relative bg-black/60 backdrop-blur-sm p-6 flex items-center space-x-6">
                {/* Rang */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${getRankStyle(entry.rank).gradient} flex items-center justify-center text-white font-bold text-xl ${getRankStyle(entry.rank).shadow} shadow-lg`}>
                  #{entry.rank}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full overflow-hidden border-3 ${getRankStyle(entry.rank).border} ${entry.rank <= 3 ? getRankStyle(entry.rank).glow : ''}`}>
                    {entry.profile?.avatar ? (
                      <img
                        src={`http://localhost:5000${entry.profile.avatar}`}
                        alt={entry.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations du joueur */}
                <div className="flex-grow">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-white font-bold text-xl">
                      {entry.username}
                    </h3>
                    <span className="text-lg">
                      {getCountryFlag(entry.profile?.country)}
                    </span>
                    <div className="px-3 py-1 bg-purple-600/50 rounded-full text-sm text-white">
                      Niveau {entry.profile?.level || 1}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-gray-300">
                    <span>Parties: {entry.gameStats?.totalGames || 0}</span>
                    <span>Lignes: {entry.gameStats?.totalLinesCleared || 0}</span>
                    <span>Membre depuis {formatDate(entry.createdAt)}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-3xl font-bold ${
                    entry.rank === 1 ? 'text-yellow-400' :
                    entry.rank === 2 ? 'text-gray-300' :
                    entry.rank === 3 ? 'text-amber-600' :
                    'text-white'
                  }`}>
                    {formatScore(entry.gameStats?.bestScore)} <span className="text-gray-400 text-sm">points</span>
                  </div>
                </div>

                {/* Indicateur utilisateur actuel */}
                {user && (entry._id === user._id || entry.id === user.id) && (
                  <div className="absolute top-2 right-2 px-3 py-1 bg-green-500 rounded-full text-white text-sm font-semibold">
                    Vous
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-center mt-8 space-x-2"
        >
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            <FaChevronLeft className="inline mr-2" />
            Précédent
          </button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            Suivant
            <FaChevronRight className="inline ml-2" />
          </button>
        </motion.div>
      )}

      {/* Bouton retour */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-6 left-6"
      >
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
        >
          <FaArrowLeft />
          Retour au menu
        </button>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
