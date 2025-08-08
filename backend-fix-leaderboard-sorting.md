# Fix pour le problème de tri du leaderboard

## Problème identifié
Le leaderboard ne s'affiche pas dans le bon ordre car la route `/api/leaderboard/global` trie par `ranking.rankingPoints` au lieu de trier par `gameStats.bestScore`.

## Solution
Modifier la route `/api/leaderboard/global` dans le fichier des routes leaderboard :

```javascript
// Remplacer cette ligne :
let sortField = 'ranking.rankingPoints';

// Par :
let sortField = 'gameStats.bestScore';
```

Et aussi modifier la partie qui calcule la position de l'utilisateur connecté :

```javascript
// Remplacer :
const userPosition = await User.countDocuments({
  ...matchCondition,
  [sortField]: { $gt: req.user[sortField.split('.')[0]][sortField.split('.')[1]] }
});

// Par :
const userPosition = await User.countDocuments({
  ...matchCondition,
  'gameStats.bestScore': { $gt: req.user.gameStats.bestScore }
});
```

## Explication
- Le frontend affiche `entry.gameStats?.bestScore` comme score
- Mais le backend triait par `ranking.rankingPoints` 
- Il faut que le tri backend corresponde à ce qui est affiché frontend
- Le tri doit se faire par `gameStats.bestScore` en ordre décroissant (-1)
