# 🚀 Gestion des Versions avec Release-it

## 📦 Installation

Les dépendances sont déjà configurées dans `package.json`. Pour installer :

```bash
npm install
```

## 🎯 Utilisation

### Release Patch (1.0.0 → 1.0.1)
Pour les corrections de bugs :
```bash
npm run release:patch
```
ou simplement :
```bash
npm run release
```

### Release Minor (1.0.0 → 1.1.0)
Pour les nouvelles fonctionnalités :
```bash
npm run release:minor
```

### Release Major (1.0.0 → 2.0.0)
Pour les changements majeurs incompatibles :
```bash
npm run release:major
```

### Dry Run (test sans commit)
Pour tester la release sans rien modifier :
```bash
npm run release:dry
```

## 🔄 Processus Automatique

Quand vous lancez une release, release-it va automatiquement :

1. ✅ **Vérifier** que vous êtes sur la branche `main`
2. ✅ **Vérifier** que votre working directory est propre
3. ✅ **Exécuter** les tests (`npm run test`)
4. ✅ **Incrémenter** la version dans `package.json`
5. ✅ **Générer/Mettre à jour** le `CHANGELOG.md` avec les commits conventionnels
6. ✅ **Build** de production (`npm run build:prod`)
7. ✅ **Créer** un commit git avec message `chore: release v{version}`
8. ✅ **Créer** un tag git `v{version}`
9. ✅ **Pusher** le commit et le tag sur le repository distant

## 📝 Commits Conventionnels

Pour que le CHANGELOG soit généré automatiquement, utilisez le format de commits conventionnels :

### Format
```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types principaux
- **feat**: Nouvelle fonctionnalité (bump minor)
- **fix**: Correction de bug (bump patch)
- **docs**: Changements de documentation
- **style**: Formatage, espaces, etc. (pas de changement de code)
- **refactor**: Refactoring de code
- **perf**: Amélioration de performance
- **test**: Ajout ou modification de tests
- **chore**: Tâches de maintenance (build, etc.)

### Exemples
```bash
git commit -m "feat(detector): ajouter détection automatique 8K"
git commit -m "fix(score): corriger calcul multiplicateur temples"
git commit -m "docs: mettre à jour README avec instructions release"
git commit -m "chore: mettre à jour dépendances Angular"
```

### Breaking Changes
Pour indiquer un changement majeur (bump major) :
```bash
git commit -m "feat(api): changer format de réponse

BREAKING CHANGE: Le format de réponse de l'API a changé"
```

## 🛠️ Configuration

La configuration est dans `.release-it.json` :

```json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}",
    "requireCleanWorkingDir": true,
    "requireBranch": "main",
    "push": true
  },
  "hooks": {
    "before:init": ["npm run test"],
    "after:bump": ["npm run build:prod"]
  }
}
```

### Personnalisation

Pour modifier le comportement :

**Ne pas exécuter les tests avant release :**
```json
"hooks": {
  "before:init": []
}
```

**Ne pas build automatiquement :**
```json
"hooks": {
  "after:bump": []
}
```

**Changer la branche requise :**
```json
"git": {
  "requireBranch": "develop"
}
```

## 📊 Workflow Recommandé

### 1. Développement
```bash
# Faire vos modifications
git add .
git commit -m "feat(camera): améliorer qualité capture"
git push
```

### 2. Test en local
```bash
# Tester sans rien modifier
npm run release:dry
```

### 3. Release
```bash
# Release réelle
npm run release:patch  # ou :minor ou :major
```

### 4. Déploiement
Les fichiers buildés sont dans `dist/faraway/browser/`
```bash
# Déployer sur votre hébergeur (Netlify, etc.)
```

## 🔍 Vérification

Après une release, vérifiez :

1. **Version mise à jour** dans `package.json`
2. **CHANGELOG.md** généré/mis à jour
3. **Tag créé** : `git tag` pour lister
4. **Commit et tag poussés** : `git log --oneline -5`

## 🐛 Dépannage

### Erreur : "Working dir must be clean"
```bash
# Commiter ou stasher vos changements
git add .
git commit -m "feat: mes changements"
```

### Erreur : "Not on required branch"
```bash
# Aller sur la branche main
git checkout main
```

### Erreur lors des tests
```bash
# Corriger les tests avant de relancer
npm run test
npm run release
```

### Annuler une release locale (avant push)
```bash
# Annuler le dernier commit et tag
git reset --hard HEAD~1
git tag -d v1.0.1  # Remplacer par votre version
```

### Annuler une release poussée (⚠️ attention)
```bash
# NE PAS FAIRE SI D'AUTRES ONT DÉJÀ PULL
git push --delete origin v1.0.1
git tag -d v1.0.1
git reset --hard HEAD~1
git push --force
```

## 📚 Ressources

- [Release-it Documentation](https://github.com/release-it/release-it)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## ✨ Commandes Rapides

```bash
# Release patch (défaut)
npm run release

# Test sans modifications
npm run release:dry

# Release minor avec message personnalisé
npm run release:minor -- -m "feat: nouvelle version avec PWA améliorée"

# Voir la version actuelle
npm version

# Voir l'historique des releases
git tag -l
```
