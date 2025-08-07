import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaWifi, FaTimes } from 'react-icons/fa';
import { checkServerHealth } from '../utils/apiConfig';

const NetworkStatus = () => {
  const [isServerDown, setIsServerDown] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [lastCheck, setLastCheck] = useState(Date.now());

  useEffect(() => {
    let intervalId;
    let timeoutId;

    const checkServer = async () => {
      try {
        const isHealthy = await checkServerHealth();
        const now = Date.now();
        
        if (!isHealthy && !isServerDown) {
          setIsServerDown(true);
          setShowAlert(true);
          console.warn('Serveur backend non accessible');
        } else if (isHealthy && isServerDown) {
          setIsServerDown(false);
          // Garder l'alerte visible quelques secondes pour montrer que c'est résolu
          timeoutId = setTimeout(() => {
            setShowAlert(false);
          }, 3000);
        }
        
        setLastCheck(now);
      } catch (error) {
        console.warn('Erreur lors de la vérification du serveur:', error);
      }
    };

    // Vérification initiale
    checkServer();

    // Vérification périodique toutes les 30 secondes
    intervalId = setInterval(checkServer, 30000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isServerDown]);

  const handleDismiss = () => {
    setShowAlert(false);
  };

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className={`
            flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl backdrop-blur-md border
            ${isServerDown 
              ? 'bg-red-900/90 border-red-500/50 text-red-100' 
              : 'bg-green-900/90 border-green-500/50 text-green-100'}
          `}>
            <div className="flex items-center gap-3">
              {isServerDown ? (
                <FaExclamationTriangle className="text-red-400 text-xl animate-pulse" />
              ) : (
                <FaWifi className="text-green-400 text-xl" />
              )}
              
              <div>
                <p className="font-semibold">
                  {isServerDown 
                    ? 'Connexion au serveur perdue' 
                    : 'Connexion au serveur rétablie'}
                </p>
                <p className="text-sm opacity-80">
                  {isServerDown 
                    ? 'Certaines fonctionnalités peuvent être indisponibles'
                    : 'Toutes les fonctionnalités sont disponibles'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;
