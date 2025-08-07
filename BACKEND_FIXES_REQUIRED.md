# Corrections requises côté Backend

## 1. Route Health Check (OBLIGATOIRE)

Ajouter une route de santé pour permettre au frontend de vérifier si le serveur est accessible :

```javascript
// Dans votre fichier de routes principal (ex: app.js, server.js, ou routes/index.js)

// Route de santé simple
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 2. Configuration CORS (RECOMMANDÉ)

Assurez-vous que les headers CORS sont correctement configurés :

```javascript
// Si vous utilisez le middleware cors
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vos domaines frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// OU manuellement :
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

## 3. Rate Limiting (FORTEMENT RECOMMANDÉ)

Ajouter une limitation du taux de requêtes pour éviter le spam :

```javascript
const rateLimit = require('express-rate-limit');

// Limitation générale
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limite chaque IP à 1000 requêtes par windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  }
});

// Limitation spécifique pour les routes de boutique
const shopLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limite à 30 requêtes par minute pour les routes boutique
  message: {
    error: 'Trop de requêtes vers la boutique, veuillez patienter.'
  }
});

// Application des limiteurs
app.use('/api', generalLimiter);
app.use('/api/shop', shopLimiter);
```

## 4. Gestion d'erreurs améliorée (RECOMMANDÉ)

Ajouter un middleware de gestion d'erreurs global :

```javascript
// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  // Si c'est une erreur de rate limiting
  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Trop de requêtes',
      message: 'Veuillez patienter avant de faire une nouvelle requête'
    });
  }
  
  // Autres erreurs
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});
```

## 5. Logging amélioré (OPTIONNEL)

Ajouter des logs pour surveiller les requêtes :

```javascript
const morgan = require('morgan');

// Log des requêtes
app.use(morgan('combined'));

// Log personnalisé pour les erreurs 429
app.use('/api/shop', (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode === 429) {
      console.warn(`Rate limit atteint pour ${req.ip} sur ${req.originalUrl}`);
    }
    originalSend.call(this, data);
  };
  next();
});
```

## 6. Validation des requêtes (OPTIONNEL)

Ajouter une validation pour éviter les requêtes malformées :

```javascript
// Middleware de validation pour les routes de boutique
const validateShopRequest = (req, res, next) => {
  // Vérifier que l'utilisateur est authentifié pour les routes sensibles
  if (req.path.includes('purchase') && !req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }
  next();
};

app.use('/api/shop', validateShopRequest);
```

## Installation des dépendances nécessaires

```bash
npm install express-rate-limit morgan cors
```

## Ordre de priorité des corrections :

1. **CRITIQUE** : Route `/api/health` (obligatoire pour le NetworkStatus)
2. **IMPORTANT** : Configuration CORS appropriée
3. **IMPORTANT** : Rate limiting sur `/api/shop`
4. **RECOMMANDÉ** : Middleware de gestion d'erreurs
5. **OPTIONNEL** : Logging et validation

## Test de la route health

Une fois implémentée, vous pouvez tester la route health :

```bash
curl http://localhost:5000/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2025-01-07T14:19:28.000Z",
  "uptime": 1234.567
}
```

## Notes importantes :

- La route `/api/health` est **obligatoire** pour que le composant NetworkStatus fonctionne
- Le rate limiting évitera les crashes futurs dus au spam de requêtes
- Les headers CORS résoudront les erreurs de politique CORS
- Redémarrez votre serveur backend après avoir appliqué ces modifications
