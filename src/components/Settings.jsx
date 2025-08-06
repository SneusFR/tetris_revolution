import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaVolumeUp, FaMusic, FaPalette, FaEye, FaGamepad, FaKeyboard } from 'react-icons/fa';
import useGameStore from '../store/gameStore';
import soundManager from '../utils/soundManager';

const Settings = ({ onBack }) => {
  const { settings, updateSettings } = useGameStore();
  const [rebindingKey, setRebindingKey] = useState(null);

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

  const handleKeyRebind = (action) => {
    setRebindingKey(action);
  };

  const handleKeyPress = (e) => {
    if (rebindingKey) {
      e.preventDefault();
      const currentKeyBindings = settings.keyBindings || {
        moveLeft: 'ArrowLeft',
        moveRight: 'ArrowRight',
        softDrop: 'ArrowDown',
        hardDrop: ' ',
        rotate: 'ArrowUp',
        hold: 'c',
        pause: 'p'
      };
      const newKeyBindings = {
        ...currentKeyBindings,
        [rebindingKey]: e.key
      };
      updateSettings({ keyBindings: newKeyBindings });
      setRebindingKey(null);
    }
  };

  React.useEffect(() => {
    if (rebindingKey) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [rebindingKey]);

  const getKeyDisplay = (key) => {
    const keyMap = {
      ' ': 'Espace',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'Enter': 'Entrée',
      'Escape': 'Échap',
      'Shift': 'Maj',
      'Control': 'Ctrl',
      'Alt': 'Alt',
      'Tab': 'Tab',
      'Backspace': 'Retour',
      'Delete': 'Suppr'
    };
    return keyMap[key] || key.toUpperCase();
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

        {/* Key Bindings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <FaKeyboard />
            </div>
            <h2 className="text-2xl font-bold">Configuration des Touches</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'moveLeft', label: 'Déplacer à gauche' },
              { key: 'moveRight', label: 'Déplacer à droite' },
              { key: 'softDrop', label: 'Descente rapide' },
              { key: 'hardDrop', label: 'Drop instantané' },
              { key: 'rotate', label: 'Rotation' },
              { key: 'hold', label: 'Hold (Réserver)' },
              { key: 'pause', label: 'Pause' }
            ].map((control) => {
              const keyBindings = settings.keyBindings || {
                moveLeft: 'ArrowLeft',
                moveRight: 'ArrowRight',
                softDrop: 'ArrowDown',
                hardDrop: ' ',
                rotate: 'ArrowUp',
                hold: 'c',
                pause: 'p'
              };
              return (
                <div key={control.key} className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-lg">{control.label}</span>
                  <button
                    onClick={() => handleKeyRebind(control.key)}
                    className={`
                      px-4 py-2 rounded-lg font-mono text-lg transition-all
                      ${rebindingKey === control.key 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse' 
                        : 'bg-gray-700 hover:bg-gray-600'
                      }
                    `}
                  >
                    {rebindingKey === control.key 
                      ? 'Appuyez sur une touche...' 
                      : getKeyDisplay(keyBindings[control.key])
                    }
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">
              💡 Cliquez sur une touche pour la modifier. Appuyez sur la nouvelle touche pour la définir.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
