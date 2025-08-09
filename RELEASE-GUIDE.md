# 🚀 Guide de Publication des Releases

Ce guide explique comment publier une nouvelle version de Tetris Revolution sur GitHub Releases.

## 📋 Prérequis

1. **GitHub CLI installé** : 
   ```bash
   # Windows (avec Chocolatey)
   choco install gh
   
   # Ou télécharger depuis : https://cli.github.com/
   ```

2. **Authentification GitHub CLI** :
   ```bash
   gh auth login
   ```

3. **Application buildée** :
   ```bash
   npm run electron:dist
   ```

## 🎯 Méthodes de Publication

### Méthode 1 : Publication Automatique (Recommandée)

```bash
# Build et publie automatiquement
npm run release

# Ou avec une version spécifique
npm run publish:release v1.0.1
```

### Méthode 2 : Publication Manuelle

1. **Builder l'application** :
   ```bash
   npm run electron:dist
   ```

2. **Publier la release** :
   ```bash
   node scripts/publish-release.js v1.0.1
   ```

### Méthode 3 : Via GitHub Actions

1. **Créer un tag** :
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. **Le workflow GitHub Actions se déclenche automatiquement** et build pour toutes les plateformes.

## 📦 Fichiers Générés

Après le build, les fichiers suivants sont créés dans `dist-electron/` :

### Windows
- `Tetris Revolution Setup 1.0.0.exe` - Installateur NSIS
- `Tetris Revolution 1.0.0.exe` - Version portable

### macOS
- `Tetris Revolution-1.0.0.dmg` - Image disque macOS

### Linux
- `Tetris Revolution-1.0.0.AppImage` - Application portable
- `tetris-revolution_1.0.0_amd64.deb` - Package Debian

## 🔗 Liens de Téléchargement

Une fois la release publiée, les liens de téléchargement seront :

```
https://github.com/SneusFR/tetris_revolution/releases/latest/download/Tetris-Revolution-Setup-1.0.0.exe
https://github.com/SneusFR/tetris_revolution/releases/latest/download/Tetris-Revolution-1.0.0.exe
https://github.com/SneusFR/tetris_revolution/releases/latest/download/Tetris-Revolution-1.0.0.dmg
https://github.com/SneusFR/tetris_revolution/releases/latest/download/Tetris-Revolution-1.0.0.AppImage
```

## 🎮 Composant DownloadClient

Le composant `DownloadClient.jsx` utilise automatiquement ces liens pour proposer le téléchargement aux utilisateurs web.

## 🔧 Dépannage

### Erreur "gh: command not found"
- Installez GitHub CLI : https://cli.github.com/

### Erreur d'authentification
```bash
gh auth login
```

### Fichiers manquants
```bash
# Vérifiez que le build a réussi
ls dist-electron/
```

### Tag déjà existant
```bash
# Supprimer le tag local et distant
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

## 📝 Notes de Version

Les notes de version sont générées automatiquement avec :
- Liste des fonctionnalités
- Instructions d'installation
- Liens de téléchargement
- Informations de compatibilité

## 🚀 Workflow Complet

1. **Développement terminé** ✅
2. **Tests effectués** ✅
3. **Version mise à jour dans package.json** ✅
4. **Commit et push des changements** ✅
5. **Lancer la publication** :
   ```bash
   npm run release v1.0.1
   ```
6. **Vérifier la release sur GitHub** 🎉

---

*Guide créé pour Tetris Revolution - Version Desktop*
