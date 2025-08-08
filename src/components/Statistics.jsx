import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaTrophy, FaChartLine, FaGamepad, FaClock, FaStar, FaFire, FaSpinner } from 'react-icons/fa';
import useAuthStore from '../store/authStore';
import apiService from '../services/api';

const Statistics = ({ onBack }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('all');

  // Récupérer les statistiques depuis l'API
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!isAuthenticated || !user) {
        setError('Vous devez être connecté pour voir les statistiques');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const statsData = await apiService.getUserStats(user.username, period);
        
        if (statsData) {
          setStatistics(statsData);
        } else {
          setError('Impossible de récupérer les statistiques');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des statistiques:', err);
        setError(err.message || 'Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [isAuthenticated, user, period]);

  // Affichage de chargement
  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl animate-spin mb-4 mx-auto" />
          <p className="text-xl">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error) {
    return (
      <div className="min-h-screen p-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-4 mb-8"
        >
        <button
          onClick={onBack}
          className="p-3 rounded-lg glass-effect hover:bg-white/20 transition-colors"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <h1 className="text-4xl font-bold">Statistiques</h1>
        
        {/* Sélecteur de période */}
        <div className="ml-auto flex gap-2">
          {[
            { value: 'all', label: 'Tout' },
            { value: 'yearly', label: 'Année' },
            { value: 'monthly', label: 'Mois' },
            { value: 'weekly', label: 'Semaine' },
            { value: 'daily', label: 'Jour' }
          ].map((periodOption) => (
            <button
              key={periodOption.value}
              onClick={() => setPeriod(periodOption.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === periodOption.value
                  ? 'bg-blue-600 text-white'
                  : 'glass-effect hover:bg-white/20'
              }`}
            >
              {periodOption.label}
            </button>
          ))}
        </div>
        </motion.div>
        
        <div className="card p-8 text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Erreur</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si pas de statistiques
  if (!statistics) {
    return (
      <div className="min-h-screen p-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={onBack}
            className="p-3 rounded-lg glass-effect hover:bg-white/20 transition-colors"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-4xl font-bold">Statistiques</h1>
        </motion.div>
        
        <div className="card p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-4">Aucune statistique</h2>
          <p className="text-gray-400">Jouez quelques parties pour voir vos statistiques !</p>
        </div>
      </div>
    );
  }

  // Utiliser les vraies statistiques de l'API
  const userStats = statistics.stats;
  const userProfile = statistics.user;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const statsCards = [
    {
      icon: <FaTrophy className="text-3xl" />,
      label: 'Meilleur Score',
      value: (userStats.bestScore || 0).toLocaleString(),
      color: 'from-yellow-400 to-yellow-600',
      delay: 0.1
    },
    {
      icon: <FaGamepad className="text-3xl" />,
      label: 'Parties Jouées',
      value: userStats.totalGames || 0,
      color: 'from-blue-400 to-blue-600',
      delay: 0.2
    },
    {
      icon: <FaChartLine className="text-3xl" />,
      label: 'Score Total',
      value: (userStats.totalScore || 0).toLocaleString(),
      color: 'from-green-400 to-green-600',
      delay: 0.3
    },
    {
      icon: <FaStar className="text-3xl" />,
      label: 'Lignes Effacées',
      value: (userStats.totalLinesCleared || 0).toLocaleString(),
      color: 'from-purple-400 to-purple-600',
      delay: 0.4
    },
    {
      icon: <FaClock className="text-3xl" />,
      label: 'Temps de Jeu',
      value: formatTime(Math.floor((userStats.totalTimePlayed || 0) / 1000)), // Convertir ms en secondes
      color: 'from-pink-400 to-pink-600',
      delay: 0.5
    },
    {
      icon: <FaFire className="text-3xl" />,
      label: 'Meilleur Combo',
      value: userStats.maxCombo || 0,
      color: 'from-red-400 to-red-600',
      delay: 0.6
    }
  ];

  const achievements = [
    {
      name: 'Première Victoire',
      description: 'Terminer votre première partie',
      unlocked: (userStats.totalGames || 0) > 0,
      icon: '🎮'
    },
    {
      name: 'Centurion',
      description: 'Atteindre 100 000 points',
      unlocked: (userStats.bestScore || 0) >= 100000,
      icon: '💯'
    },
    {
      name: 'Maître Tetris',
      description: 'Effacer 1000 lignes au total',
      unlocked: (userStats.totalLinesCleared || 0) >= 1000,
      icon: '👑'
    },
    {
      name: 'Collectionneur',
      description: 'Posséder 3 thèmes différents',
      unlocked: (userProfile?.inventory?.unlockedThemes?.length || 0) >= 3,
      icon: '🎨'
    },
    {
      name: 'Effets Spéciaux',
      description: 'Posséder 3 effets différents',
      unlocked: (userProfile?.inventory?.unlockedEffects?.length || 0) >= 3,
      icon: '✨'
    },
    {
      name: 'Riche',
      description: 'Accumuler 5000 crédits',
      unlocked: (userProfile?.profile?.credits || 0) >= 5000,
      icon: '💰'
    },
    {
      name: 'Vétéran',
      description: 'Jouer 100 parties',
      unlocked: (userStats.totalGames || 0) >= 100,
      icon: '🏆'
    },
    {
      name: 'Perfectionniste',
      description: 'Réaliser 10 perfect clears',
      unlocked: (userStats.totalPerfectClears || 0) >= 10,
      icon: '⭐'
    }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionPercentage = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-4 mb-8"
      >
        <button
          onClick={onBack}
          className="p-3 rounded-lg glass-effect hover:bg-white/20 transition-colors"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <h1 className="text-4xl font-bold">Statistiques</h1>
        
        {/* Sélecteur de période */}
        <div className="ml-auto flex gap-2">
          {[
            { value: 'all', label: 'Tout' },
            { value: 'yearly', label: 'Année' },
            { value: 'monthly', label: 'Mois' },
            { value: 'weekly', label: 'Semaine' },
            { value: 'daily', label: 'Jour' }
          ].map((periodOption) => (
            <button
              key={periodOption.value}
              onClick={() => setPeriod(periodOption.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                period === periodOption.value
                  ? 'bg-blue-600 text-white'
                  : 'glass-effect hover:bg-white/20'
              }`}
            >
              {periodOption.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            className="card p-6 hover:shadow-2xl transition-shadow"
          >
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${stat.color} mb-4`}>
              {stat.icon}
            </div>
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Succès</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Progression</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
              <span className="font-bold">{completionPercentage}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.name}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + index * 0.05 }}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${achievement.unlocked 
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 bg-gray-800 opacity-50'}
              `}
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <h3 className={`font-bold mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                {achievement.name}
              </h3>
              <p className="text-xs text-gray-400">{achievement.description}</p>
              {achievement.unlocked && (
                <div className="mt-2 text-xs text-green-400 font-semibold">✓ Débloqué</div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="card p-6 mt-6"
      >
        <h2 className="text-2xl font-bold mb-4">Performance Moyenne</h2>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <p className="text-gray-400 mb-2">Score Moyen</p>
            <p className="text-2xl font-bold">
              {(userStats.averageScore || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Lignes par Partie</p>
            <p className="text-2xl font-bold">
              {(userStats.totalGames || 0) > 0 
                ? Math.round((userStats.totalLinesCleared || 0) / userStats.totalGames)
                : '0'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Temps Moyen</p>
            <p className="text-2xl font-bold">
              {(userStats.averageTimePlayed || 0) > 0 
                ? formatTime(Math.floor(userStats.averageTimePlayed / 1000))
                : '0s'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Statistics;
