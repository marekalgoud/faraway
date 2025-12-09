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

// Mettre à jour sw.js avec la nouvelle version
const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Remplacer les noms de cache avec la nouvelle version
swContent = swContent.replace(
  /const CACHE_NAME = 'faraway-v[\d.]+';/,
  `const CACHE_NAME = 'faraway-v${version}';`
);
swContent = swContent.replace(
  /const STATIC_CACHE = 'faraway-static-v[\d.]+';/,
  `const STATIC_CACHE = 'faraway-static-v${version}';`
);
swContent = swContent.replace(
  /const DYNAMIC_CACHE = 'faraway-dynamic-v[\d.]+';/,
  `const DYNAMIC_CACHE = 'faraway-dynamic-v${version}';`
);
swContent = swContent.replace(
  /const MODELS_CACHE = 'faraway-models-v[\d.]+';/,
  `const MODELS_CACHE = 'faraway-models-v${version}';`
);

fs.writeFileSync(swPath, swContent, 'utf8');

console.log(`✅ Version mise à jour vers ${version} (environments + service worker)`);
