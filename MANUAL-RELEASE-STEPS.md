# 🚀 Étapes pour Créer une Release Manuellement

## 📋 Étapes Rapides

### 1. Aller sur GitHub
Va sur : https://github.com/SneusFR/tetris_revolution/releases/new

### 2. Remplir le formulaire de release

**Tag version :** `v1.0.0` (déjà créé ✅)

**Release title :** `Tetris Revolution v1.0.0`

**Description :**
```markdown
# Tetris Revolution v1.0.0

## 🎮 Nouvelle version desktop disponible !

### ✨ Fonctionnalités :
- 🎯 Jeu Tetris complet avec effets visuels
- 🏆 Système de classement en ligne
- 🎨 Thèmes personnalisables
- 🔊 Effets sonores immersifs
- 📊 Statistiques détaillées
- 👤 Système de profil utilisateur

### 📦 Téléchargements disponibles :
- **Windows** : `Tetris Revolution Setup 1.0.0.exe` (Installateur)
- **Windows** : `Tetris Revolution 1.0.0.exe` (Portable)

### 🔧 Installation :
1. Téléchargez le fichier correspondant à votre système
2. Lancez l'installateur ou l'exécutable
3. Profitez du jeu !

---
*Version buildée automatiquement*
```

### 3. Uploader les fichiers

Dans la section "Attach binaries", glisse-dépose ces fichiers depuis `dist-electron/` :

- ✅ `Tetris Revolution Setup 1.0.0.exe` (Installateur Windows)
- ✅ `Tetris Revolution 1.0.0.exe` (Version portable Windows)

### 4. Publier

Clique sur **"Publish release"**

## 🎉 Résultat

Une fois publié, tes fichiers seront disponibles aux URLs :

- `https://github.com/SneusFR/tetris_revolution/releases/latest/download/Tetris%20Revolution%20Setup%201.0.0.exe`
- `https://github.com/SneusFR/tetris_revolution/releases/latest/download/Tetris%20Revolution%201.0.0.exe`

## 🔗 Liens Directs

- **Page des releases :** https://github.com/SneusFR/tetris_revolution/releases
- **Créer une nouvelle release :** https://github.com/SneusFR/tetris_revolution/releases/new

---

*Le composant DownloadClient de ton app web utilisera automatiquement ces liens !*
