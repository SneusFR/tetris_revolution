import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaVolumeUp, FaMusic, FaPalette, FaEye, FaGamepad } from 'react-icons/fa';
import useGameStore from '../store/gameStore';
import soundManager from '../utils/soundManager';

const Settings = ({ onBack }) => {
  const { settings, updateSettings } = useGameStore();

  const handleToggle = (key) => {
    const newValue = !settings[key];
    const newSettings = { [key]: newValue };
    updateSettings(newSettings);
    
    // Apply sound changes immediately
    if (key === 'soundEnabled' || key === 'musicEnabled') {
      soundManager.updateSettings({ ...settings, ...newSettings });
    }
  };

  const handleSliderChange = (key, value) => {
    const newValue = parseFloat(value);
    const newSettings = { [key]: newValue };
    updateSettings(newSettings);
    
    // Apply volume changes immediately
    if (key === 'soundVolume' || key === 'musicVolume') {
      soundManager.updateSettings({ ...settings, ...newSettings });
    }
  };

  const handleNumberChange = (key, value) => {
    updateSettings({ [key]: parseInt(value) });
  };

  const settingsGroups = [
    {
      title: 'Audio',
      icon: <FaVolumeUp />,
      settings: [
        {
          key: 'soundEnabled',
          label: 'Effets Sonores',
          type: 'toggle',
          value: settings.soundEnabled
        },
        {
          key: 'soundVolume',
          label: 'Volume des Effets',
          type: 'slider',
          value: settings.soundVolume,
          min: 0,
          max: 1,
          step: 0.1,
          disabled: !settings.soundEnabled
        },
        {
          key: 'musicEnabled',
          label: 'Musique',
          type: 'toggle',
          value: settings.musicEnabled
        },
        {
          key: 'musicVolume',
          label: 'Volume de la Musique',
          type: 'slider',
          value: settings.musicVolume,
          min: 0,
          max: 1,
          step: 0.1,
          disabled: !settings.musicEnabled
        }
      ]
    },
    {
      title: 'Graphismes',
      icon: <FaPalette />,
      settings: [
        {
          key: 'particleEffects',
          label: 'Effets de Particules',
          type: 'toggle',
          value: settings.particleEffects
        },
        {
          key: 'screenShake',
          label: 'Secousse d\'Écran',
          type: 'toggle',
          value: settings.screenShake
        }
      ]
    },
    {
      title: 'Gameplay',
      icon: <FaGamepad />,
      settings: [
        {
          key: 'ghostPiece',
          label: 'Pièce Fantôme',
          type: 'toggle',
          value: settings.ghostPiece,
          description: 'Affiche où la pièce va atterrir'
        },
        {
          key: 'gridLines',
          label: 'Lignes de Grille',
          type: 'toggle',
          value: settings.gridLines,
          description: 'Affiche les lignes de la grille'
        }
      ]
    },
    {
      title: 'Contrôles Pro (DAS/ARR)',
      icon: <FaEye />,
      settings: [
        {
          key: 'das',
          label: 'DAS (Delayed Auto Shift)',
          type: 'number',
          value: settings.das,
          min: 0,
          max: 300,
          step: 10,
          unit: 'ms',
          description: 'Délai avant l\'auto-répétition latérale (0-300ms)'
        },
        {
          key: 'arr',
          label: 'ARR (Auto Repeat Rate)',
          type: 'number',
          value: settings.arr,
          min: 0,
          max: 100,
          step: 5,
          unit: 'ms',
          description: 'Délai entre les répétitions (0 = instantané)'
        },
        {
          key: 'sdf',
          label: 'SDF (Soft Drop Factor)',
          type: 'number',
          value: settings.sdf,
          min: 1,
          max: 20,
          step: 1,
          unit: 'x',
          description: 'Multiplicateur de vitesse pour la descente douce'
        }
      ]
    }
  ];

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
        <h1 className="text-4xl font-bold">Paramètres</h1>
      </motion.div>

      {/* Settings Groups */}
      <div className="max-w-4xl mx-auto space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {group.icon}
              </div>
              <h2 className="text-2xl font-bold">{group.title}</h2>
            </div>

            <div className="space-y-4">
              {group.settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <label className="text-lg font-medium">{setting.label}</label>
                    {setting.description && (
                      <p className="text-sm text-gray-400 mt-1">{setting.description}</p>
                    )}
                  </div>

                  {setting.type === 'toggle' && (
                    <button
                      onClick={() => handleToggle(setting.key)}
                      className={`
                        relative w-14 h-7 rounded-full transition-colors duration-300
                        ${setting.value ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-600'}
                      `}
                    >
                      <motion.div
                        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
                        animate={{ left: setting.value ? '32px' : '4px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  )}

                  {setting.type === 'slider' && (
                    <div className="flex items-center gap-4 w-64">
                      <input
                        type="range"
                        min={setting.min}
                        max={setting.max}
                        step={setting.step}
                        value={setting.value}
                        onChange={(e) => handleSliderChange(setting.key, e.target.value)}
                        disabled={setting.disabled}
                        className={`
                          w-full h-2 rounded-lg appearance-none cursor-pointer
                          ${setting.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        style={{
                          background: `linear-gradient(to right, 
                            rgb(59, 130, 246) 0%, 
                            rgb(59, 130, 246) ${setting.value * 100}%, 
                            rgb(75, 85, 99) ${setting.value * 100}%, 
                            rgb(75, 85, 99) 100%)`
                        }}
                      />
                      <span className="text-sm font-mono w-12 text-right">
                        {Math.round(setting.value * 100)}%
                      </span>
                    </div>
                  )}

                  {setting.type === 'number' && (
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={setting.min}
                        max={setting.max}
                        step={setting.step}
                        value={setting.value}
                        onChange={(e) => handleNumberChange(setting.key, e.target.value)}
                        className="w-48 h-2 rounded-lg appearance-none cursor-pointer bg-gray-600"
                        style={{
                          background: `linear-gradient(to right, 
                            rgb(59, 130, 246) 0%, 
                            rgb(59, 130, 246) ${((setting.value - setting.min) / (setting.max - setting.min)) * 100}%, 
                            rgb(75, 85, 99) ${((setting.value - setting.min) / (setting.max - setting.min)) * 100}%, 
                            rgb(75, 85, 99) 100%)`
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={setting.min}
                          max={setting.max}
                          step={setting.step}
                          value={setting.value}
                          onChange={(e) => handleNumberChange(setting.key, e.target.value)}
                          className="w-16 px-2 py-1 text-sm font-mono bg-gray-700 border border-gray-600 rounded text-center focus:border-blue-500 focus:outline-none"
                        />
                        <span className="text-sm text-gray-400 font-mono">
                          {setting.unit}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Controls Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
            <FaGamepad />
            Contrôles
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Déplacer à gauche</span>
                <span className="font-mono">← / A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Déplacer à droite</span>
                <span className="font-mono">→ / D</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Descente rapide</span>
                <span className="font-mono">↓ / S</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Rotation</span>
                <span className="font-mono">↑ / W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Drop instantané</span>
                <span className="font-mono">Espace</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hold</span>
                <span className="font-mono">C / Shift</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pause</span>
                <span className="font-mono">P / Esc</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
