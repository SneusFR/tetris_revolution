const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REPO = 'SneusFR/tetris_revolution';
const VERSION = process.argv[2] || 'v1.0.0';
const DIST_DIR = 'dist-electron';

console.log(`🚀 Publication de la release ${VERSION}...`);

// Vérifier que les fichiers buildés existent
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Le dossier dist-electron n\'existe pas. Lancez d\'abord npm run electron:dist');
  process.exit(1);
}

try {
  // Créer un tag Git
  console.log('📝 Création du tag Git...');
  execSync(`git tag ${VERSION}`, { stdio: 'inherit' });
  execSync(`git push origin ${VERSION}`, { stdio: 'inherit' });

  // Créer la release GitHub
  console.log('🏷️ Création de la release GitHub...');
  
  const releaseNotes = `
# Tetris Revolution ${VERSION}

## 🎮 Nouvelle version desktop disponible !

### ✨ Fonctionnalités :
- 🎯 Jeu Tetris complet avec effets visuels
- 🏆 Système de classement en ligne
- 🎨 Thèmes personnalisables
- 🔊 Effets sonores immersifs
- 📊 Statistiques détaillées
- 👤 Système de profil utilisateur

### 📦 Téléchargements disponibles :
- **Windows** : \`Tetris Revolution Setup ${VERSION.replace('v', '')}.exe\` (Installateur)
- **Windows** : \`Tetris Revolution ${VERSION.replace('v', '')}.exe\` (Portable)
- **macOS** : \`Tetris Revolution-${VERSION.replace('v', '')}.dmg\`
- **Linux** : \`Tetris Revolution-${VERSION.replace('v', '')}.AppImage\`

### 🔧 Installation :
1. Téléchargez le fichier correspondant à votre système
2. Lancez l'installateur ou l'exécutable
3. Profitez du jeu !

---
*Version buildée automatiquement*
  `.trim();

  // Créer la release avec gh CLI
  execSync(`gh release create ${VERSION} --title "Tetris Revolution ${VERSION}" --notes "${releaseNotes}"`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Uploader les fichiers
  console.log('📤 Upload des fichiers...');
  const files = fs.readdirSync(DIST_DIR).filter(file => {
    return file.endsWith('.exe') || 
           file.endsWith('.dmg') || 
           file.endsWith('.AppImage') || 
           file.endsWith('.deb') ||
           file.endsWith('.zip') ||
           file.endsWith('.tar.gz');
  });

  for (const file of files) {
    const filePath = path.join(DIST_DIR, file);
    console.log(`  📎 Upload de ${file}...`);
    execSync(`gh release upload ${VERSION} "${filePath}"`, { stdio: 'inherit' });
  }

  console.log(`✅ Release ${VERSION} publiée avec succès !`);
  console.log(`🔗 Voir la release : https://github.com/${REPO}/releases/tag/${VERSION}`);

} catch (error) {
  console.error('❌ Erreur lors de la publication :', error.message);
  process.exit(1);
}
