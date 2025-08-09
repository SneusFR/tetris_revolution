const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Construction de l\'application desktop Tetris Revolution...\n');

try {
  // Étape 1: Nettoyer les anciens builds
  console.log('📁 Nettoyage des anciens builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  if (fs.existsSync('dist-electron')) {
    fs.rmSync('dist-electron', { recursive: true, force: true });
  }

  // Étape 2: Build de l'application web
  console.log('🔨 Construction de l\'application web...');
  execSync('npm run build', { stdio: 'inherit' });

  // Étape 3: Vérifier que les icônes existent
  console.log('🎨 Vérification des icônes...');
  const iconDir = path.join(__dirname, '..', 'electron', 'icons');
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
    console.log('⚠️  Dossier d\'icônes créé. Ajoutez icon.png dans electron/icons/');
  }

  // Étape 4: Build Electron
  console.log('⚡ Construction de l\'application Electron...');
  execSync('npm run electron:dist', { stdio: 'inherit' });

  console.log('\n✅ Construction terminée avec succès !');
  console.log('📦 Les fichiers d\'installation se trouvent dans le dossier dist-electron/');
  
  // Afficher les fichiers créés
  const distElectronPath = path.join(__dirname, '..', 'dist-electron');
  if (fs.existsSync(distElectronPath)) {
    const files = fs.readdirSync(distElectronPath);
    console.log('\n📋 Fichiers créés :');
    files.forEach(file => {
      const filePath = path.join(distElectronPath, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   • ${file} (${size} MB)`);
    });
  }

} catch (error) {
  console.error('\n❌ Erreur lors de la construction :', error.message);
  process.exit(1);
}
