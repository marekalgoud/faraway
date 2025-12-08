# 🚀 Setup Release-it - Guide Rapide

## Installation

Exécutez cette commande pour installer les dépendances :

```bash
npm install
```

## Premier Test

Testez que tout fonctionne sans rien modifier :

```bash
npm run release:dry
```

Vous devriez voir un aperçu de ce qui se passerait lors d'une vraie release.

## Première Release

Une fois prêt, lancez votre première release :

```bash
npm run release
```

Release-it va :
1. ✅ Vérifier que tout est prêt (tests, branche, etc.)
2. ✅ Vous demander quel type de version (patch par défaut)
3. ✅ Incrémenter la version à 1.0.1
4. ✅ Générer le CHANGELOG
5. ✅ Créer le commit et le tag
6. ✅ Pusher sur le repository

## Vérification Post-Installation

Après l'installation, vérifiez que release-it est bien installé :

```bash
npx release-it --version
```

## Configuration Actuelle

Les fichiers suivants ont été créés/modifiés :

- ✅ `.release-it.json` - Configuration release-it
- ✅ `package.json` - Scripts et dépendances ajoutés
- ✅ `CHANGELOG.md` - Fichier de changelog initial
- ✅ `docs/RELEASE.md` - Documentation complète

## Prochaines Étapes

1. **Installer les dépendances** : `npm install`
2. **Tester** : `npm run release:dry`
3. **Commiter vos changements** : 
   ```bash
   git add .
   git commit -m "chore: setup release-it for version management"
   git push
   ```
4. **Première release** : `npm run release`

## Aide Rapide

```bash
# Test sans modification
npm run release:dry

# Release patch (1.0.0 → 1.0.1)
npm run release:patch

# Release minor (1.0.0 → 1.1.0)
npm run release:minor

# Release major (1.0.0 → 2.0.0)
npm run release:major
```

Pour plus de détails, consultez `docs/RELEASE.md`
