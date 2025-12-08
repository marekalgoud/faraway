const fs = require('fs');
const path = require('path');

// Lire la version depuis package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);

const version = packageJson.version;

// Mettre à jour environment.ts
const envPath = path.join(__dirname, '../src/environments/environment.ts');
const envContent = `// Ce fichier est généré automatiquement par le build
// Ne pas le modifier manuellement
export const environment = {
  version: '${version}',
  production: false
};
`;

fs.writeFileSync(envPath, envContent, 'utf8');

// Mettre à jour environment.prod.ts
const envProdPath = path.join(__dirname, '../src/environments/environment.prod.ts');
const envProdContent = `// Ce fichier est généré automatiquement par le build
// Ne pas le modifier manuellement
export const environment = {
  version: '${version}',
  production: true
};
`;

fs.writeFileSync(envProdPath, envProdContent, 'utf8');

console.log(`✅ Version mise à jour vers ${version}`);
