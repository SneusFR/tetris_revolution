import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaDesktop, FaWindows, FaApple, FaLinux, FaRocket, FaTimes } from 'react-icons/fa';
import { isElectron } from '../utils/electronUtils';

const DownloadClient = () => {
  const [showModal, setShowModal] = useState(false);

  // Ne pas afficher le bouton si on est déjà dans Electron
  if (isElectron()) {
    return null;
  }

  const downloadLinks = {
    windows: {
      icon: <FaWindows className="text-2xl" />,
      name: 'Windows',
      file: 'Tetris-Revolution-Setup-1.0.0.exe',
      size: '~150 MB',
      description: 'Compatible Windows 10/11 (64-bit)'
    },
    mac: {
      icon: <FaApple className="text-2xl" />,
      name: 'macOS',
      file: 'Tetris-Revolution-1.0.0.dmg',
      size: '~160 MB',
      description: 'Compatible macOS 10.15+ (Intel & Apple Silicon)'
    },
    linux: {
      icon: <FaLinux className="text-2xl" />,
      name: 'Linux',
      file: 'Tetris-Revolution-1.0.0.AppImage',
      size: '~140 MB',
      description: 'Compatible Ubuntu 18.04+ et distributions équivalentes'
    }
  };

  const handleDownload = (platform) => {
    // Ici vous pourrez ajouter les vrais liens de téléchargement
    const downloadUrl = `https://github.com/SneusFR/tetris_revolution/releases/latest/download/${downloadLinks[platform].file}`;
    
    // Pour l'instant, on simule le téléchargement
    console.log(`Téléchargement de ${downloadLinks[platform].file}`);
    
    // Créer un lien temporaire pour déclencher le téléchargement
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadLinks[platform].file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowModal(false);
  };

  return (
    <>
      {/* Bouton principal */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 left-6 z-50 group"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
          
          {/* Button content */}
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 flex items-center gap-3">
            <FaDesktop className="text-xl text-white" />
            <div className="text-left">
              <div className="text-white font-bold text-sm">Télécharger</div>
              <div className="text-blue-100 text-xs">Version Desktop</div>
            </div>
            <FaDownload className="text-white text-lg" />
          </div>
          
          {/* Pulse animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-20" />
        </div>
      </motion.button>

      {/* Modal de téléchargement */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-2xl w-full border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <FaRocket className="text-2xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Télécharger Tetris Revolution</h2>
                    <p className="text-gray-400">Profitez de l'expérience desktop ultime</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {/* Avantages */}
              <div className="mb-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                <h3 className="text-lg font-semibold text-white mb-3">🚀 Avantages de la version desktop :</h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Performance optimisée
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Mode hors ligne
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Raccourcis clavier natifs
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    Expérience immersive
                  </div>
                </div>
              </div>

              {/* Options de téléchargement */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Choisissez votre plateforme :</h3>
                
                {Object.entries(downloadLinks).map(([platform, info]) => (
                  <motion.button
                    key={platform}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDownload(platform)}
                    className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-200 flex items-center gap-4"
                  >
                    <div className="text-blue-400">
                      {info.icon}
                    </div>
                    <div className="flex-grow text-left">
                      <div className="text-white font-semibold">{info.name}</div>
                      <div className="text-gray-400 text-sm">{info.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-300 text-sm">{info.size}</div>
                      <div className="text-blue-400 text-xs">Télécharger</div>
                    </div>
                    <FaDownload className="text-blue-400" />
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
                <p>Version 1.0.0 • Gratuit • Open Source</p>
                <p className="mt-1">Compatible avec votre compte existant</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DownloadClient;
