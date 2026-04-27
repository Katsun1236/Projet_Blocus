import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !dirPath.includes('node_modules') && !dirPath.includes('dist') && !dirPath.includes('.git')) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.html') || dirPath.endsWith('.js')) {
      callback(dirPath);
    }
  });
}

const fixes = {
  'réussir': 'réussir',
  'Révision': 'Révision',
  'révision': 'révision',
  'études': 'études',
  'étudiant': 'étudiant',
  'Créer': 'Créer',
  'créer': 'créer',
  'Prêt': 'Prêt',
  'communauté': 'communauté',
  'Productivité': 'Productivité',
  'Confidentialité': 'Confidentialité',
  'Futur': 'Futur',
  'dès': 'dès',
  'dès': 'dès',
  'grâce': 'grâce',
  'adaptés': 'adaptés',
  'où': 'où',
  'succès': 'succès',
  'RÉSERVÉS': 'RÉSERVÉS',
  'déposés': 'déposés',
  'é': 'é',
  'è': 'è',
  'ê': 'ê',
  'à': 'à',
  'â': 'â',
  'î': 'î',
  'ï': 'ï',
  'ô': 'ô',
  'ù': 'ù',
  'û': 'û',
  'ç': 'ç',
  'É': 'É',
  'À': 'À',
  'Ç': 'Ç'
};

walkDir('.', function(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [bad, good] of Object.entries(fixes)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      changed = true;
    }
  }
  
  if (content.includes('2026 PROJET BLOCUS')) {
      content = content.split('2026 PROJET BLOCUS').join('2026 PROJET BLOCUS');
      changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
});