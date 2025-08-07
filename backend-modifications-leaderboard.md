# Modifications Backend pour le Leaderboard

## 1. Nouveau modèle LeaderboardEntry

Créer un nouveau modèle `models/LeaderboardEntry.js` :

```javascript
const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Une seule entrée par joueur
  },
  
  bestScore: {
    type: Number,
    required: true,
    min: [0, 'Le score ne peut pas être négatif']
  },
  
  level: {
    type: Number,
    required: true,
    min: [1, 'Le niveau minimum est 1']
  },
  
  linesCleared: {
    type: Number,
    required: true,
    min: [0, 'Le nombre de lignes ne peut pas être négatif']
  },
  
  gameMode: {
    type: String,
    enum: ['classic', 'sprint', 'ultra', 'zen'],
    required: true
  },
  
  achievedAt: {
    type: Date,
    required: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour le tri par score
leaderboardEntrySchema.index({ bestScore: -1 });
leaderboardEntrySchema.index({ player: 1 });

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);
```

## 2. Modification de la route game-result

Dans `routes/users.js`, modifier la route `/api/users/game-result` :

```javascript
const LeaderboardEntry = require('../models/LeaderboardEntry');

// Dans la route POST /api/users/game-result
router.post('/game-result', [
  // ... validations existantes
], async (req, res) => {
  try {
    // ... code existant jusqu'à la sauvegarde du game

    // Vérifier si c'est un nouveau record personnel
    const currentBest = await LeaderboardEntry.findOne({ player: user._id });
    
    if (!currentBest || gameData.score > currentBest.bestScore) {
      // Mettre à jour ou créer l'entrée du leaderboard
      await LeaderboardEntry.findOneAndUpdate(
        { player: user._id },
        {
          player: user._id,
          bestScore: gameData.score,
          level: gameData.level,
          linesCleared: gameData.linesCleared,
          gameMode: gameData.gameMode,
          achievedAt: new Date(),
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      game.isPersonalBest = true;
    }

    // ... reste du code existant
  } catch (error) {
    // ... gestion d'erreur
  }
});
```

## 3. Nouvelle route pour le leaderboard simplifié

Dans `routes/leaderboard.js`, ajouter une nouvelle route :

```javascript
const LeaderboardEntry = require('../models/LeaderboardEntry');

// @route   GET /api/leaderboard/simple
// @desc    Obtenir le leaderboard avec une entrée par joueur
// @access  Public
router.get('/simple', optionalAuth, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const leaderboard = await LeaderboardEntry.find()
      .populate({
        path: 'player',
        select: 'username profile.avatar profile.banner profile.level profile.country settings.privacy.showProfile',
        match: { 
          isActive: true,
          'settings.privacy.showProfile': true 
        }
      })
      .sort({ bestScore: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Filtrer les entrées où le joueur n'existe plus ou a un profil privé
    const filteredLeaderboard = leaderboard
      .filter(entry => entry.player)
      .map((entry, index) => ({
        rank: skip + index + 1,
        player: {
          id: entry.player._id,
          username: entry.player.username,
          avatar: entry.player.profile.avatar,
          banner: entry.player.profile.banner,
          level: entry.player.profile.level,
          country: entry.player.profile.country
        },
        bestScore: entry.bestScore,
        level: entry.level,
        linesCleared: entry.linesCleared,
        gameMode: entry.gameMode,
        achievedAt: entry.achievedAt
      }));

    const total = await LeaderboardEntry.countDocuments();

    // Position de l'utilisateur connecté
    let userRank = null;
    if (req.user) {
      const userEntry = await LeaderboardEntry.findOne({ player: req.user._id });
      if (userEntry) {
        const betterScores = await LeaderboardEntry.countDocuments({
          bestScore: { $gt: userEntry.bestScore }
        });
        userRank = betterScores + 1;
      }
    }

    res.json({
      success: true,
      data: {
        leaderboard: filteredLeaderboard,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: filteredLeaderboard.length,
          totalEntries: total
        },
        userRank
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du leaderboard simple:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});
```

## 4. Migration des données existantes (optionnel)

Créer un script de migration pour populer le nouveau modèle LeaderboardEntry avec les meilleurs scores existants :

```javascript
// scripts/migrate-leaderboard.js
const mongoose = require('mongoose');
const Game = require('../models/Game');
const LeaderboardEntry = require('../models/LeaderboardEntry');

async function migrateLeaderboard() {
  try {
    // Récupérer le meilleur score de chaque joueur
    const bestScores = await Game.aggregate([
      {
        $group: {
          _id: '$player',
          bestScore: { $max: '$score' },
          bestGame: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'games',
          let: { playerId: '$_id', bestScore: '$bestScore' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$player', '$$playerId'] },
                    { $eq: ['$score', '$$bestScore'] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'bestGame'
        }
      },
      { $unwind: '$bestGame' }
    ]);

    // Créer les entrées du leaderboard
    for (const entry of bestScores) {
      const game = entry.bestGame;
      await LeaderboardEntry.findOneAndUpdate(
        { player: game.player },
        {
          player: game.player,
          bestScore: game.score,
          level: game.level,
          linesCleared: game.linesCleared,
          gameMode: game.gameMode,
          achievedAt: game.createdAt,
          updatedAt: new Date()
        },
        { upsert: true }
      );
    }

    console.log(`Migration terminée: ${bestScores.length} entrées créées`);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  }
}

module.exports = migrateLeaderboard;
```

## Résumé des modifications

1. **Nouveau modèle LeaderboardEntry** : Stocke une entrée par joueur avec son meilleur score
2. **Modification de game-result** : Met à jour automatiquement le leaderboard quand un nouveau record est établi
3. **Nouvelle route /api/leaderboard/simple** : Retourne le leaderboard avec une entrée par joueur, trié par score
4. **Script de migration** : Pour populer le nouveau modèle avec les données existantes

Ces modifications permettront d'avoir un leaderboard efficace avec une seule entrée par joueur, automatiquement mis à jour à chaque nouveau record personnel.
