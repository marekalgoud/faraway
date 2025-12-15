# Changelog

## [1.0.7](https://github.com/marekalgoud/faraway/compare/v1.0.6...v1.0.7) (2025-12-15)


### Bug Fixes

* améliorations mineures ([edcd1f3](https://github.com/marekalgoud/faraway/commit/edcd1f3d345ca5098b93a9f5c97e3151a0b644a3))

## [1.0.6](https://github.com/marekalgoud/faraway/compare/v1.0.5...v1.0.6) (2025-12-15)


### Bug Fixes

* correction affichage input sur certains mobiles ([8e9125a](https://github.com/marekalgoud/faraway/commit/8e9125ac0bc37e224a06d0c014eae2ae6e9c9b81))
* correction du footer qui empiete sur la caméra ([f21fa61](https://github.com/marekalgoud/faraway/commit/f21fa6115ce39112032a7669b97df53f95bb827d))
* image de partage sur les reseaux sociaux ([527f782](https://github.com/marekalgoud/faraway/commit/527f782460bbae6d904136bdd270c07185d9a9a7))

## [1.0.5](https://github.com/marekalgoud/faraway/compare/v1.0.4...v1.0.5) (2025-12-10)


### Bug Fixes

* deplacement de l'affichage du résultat au dessus du tableau ([d6cfb8c](https://github.com/marekalgoud/faraway/commit/d6cfb8c41bf575ffb2b11797e281eb1c7cccdc5d))

## [1.0.4](https://github.com/marekalgoud/faraway/compare/v1.0.3...v1.0.4) (2025-12-10)


### Bug Fixes

* correction action maj mode PWA ([87ba47e](https://github.com/marekalgoud/faraway/commit/87ba47ee26e1a4ef3aecea3d576dc912ae99f3be))

## [1.0.3](https://github.com/marekalgoud/faraway/compare/v1.0.2...v1.0.3) (2025-12-10)


### Bug Fixes

* correction mode hors ligne ([e7cdd65](https://github.com/marekalgoud/faraway/commit/e7cdd654be713e2f284fd0072cf7d6304e41a213))

## [1.0.2](https://github.com/marekalgoud/faraway/compare/v1.0.1...v1.0.2) (2025-12-10)


### Bug Fixes

* correction bg color + fix mode hors ligne ([727f562](https://github.com/marekalgoud/faraway/commit/727f562a4d0608387183dd657ad33dc593356456))

## 1.0.1 (2025-12-09)


### Bug Fixes

* ajout pollyfill ([9ae039f](https://github.com/marekalgoud/faraway/commit/9ae039fa48c20295e8024d45aed5af6e135c2ade))
* correction build netlify ([b7ca7b2](https://github.com/marekalgoud/faraway/commit/b7ca7b23bdf7f99fd0819d3431ea9b6a0b9fe45f))
* correction taille canvas pour prise de photo ([5b02c31](https://github.com/marekalgoud/faraway/commit/5b02c3111b66667fd8934048fb594e33d170f85a))
* favicon ([615e134](https://github.com/marekalgoud/faraway/commit/615e13441f79c6a50f057195062dff6ba0e9265b))
* suppression TU sur release ([ebf653c](https://github.com/marekalgoud/faraway/commit/ebf653c1e02fe9468ff1916bbdeabc76b34b3de1))


### Features

* ajout de l'image de démo ([97c587f](https://github.com/marekalgoud/faraway/commit/97c587f5a87f6050b0eabb54498a10aaadc2dc7e))
* ajout mode PWA ([af7ac80](https://github.com/marekalgoud/faraway/commit/af7ac80cd2b51773eae8a72a1c61476d678d0932))
* maj du favicon ([8dedbf1](https://github.com/marekalgoud/faraway/commit/8dedbf1e46efb556dabe22c93bece598850195dc))
* maj du modele des temples ([eb3c8ec](https://github.com/marekalgoud/faraway/commit/eb3c8ec33816e8641d74539c6de7567ed05ac823))
* maj modele carte ([3aec792](https://github.com/marekalgoud/faraway/commit/3aec79264c444afbeee65073e2262870a407674f))
* maj modele des cartes ([db00fe4](https://github.com/marekalgoud/faraway/commit/db00fe4cf3e3a8a85950577b3bff11bfa2789318))
* maj modele pour les cartes ([b3f5380](https://github.com/marekalgoud/faraway/commit/b3f53802fd8c682bfd6f23522c2dbbda0ca040cd))
* mise en forme détail calcul ([bb2e7c8](https://github.com/marekalgoud/faraway/commit/bb2e7c8e053bc01c5ea7e967bcba2c9ac2dab3b3))
* mise en place de la traduction ([ee84fe7](https://github.com/marekalgoud/faraway/commit/ee84fe77e1279d6f15e859848a70e73e29453784))
* mise en place de release-it ([8706dd7](https://github.com/marekalgoud/faraway/commit/8706dd7e7279b57258fef265b58cbccd88b4a519))
* mise en place du footer ([739ed0d](https://github.com/marekalgoud/faraway/commit/739ed0d7c5896b0f0dacf0926a715733022c763c))

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [1.0.0] - 2025-12-08

### Added
- Détection automatique de cartes Faraway par IA
- Calcul automatique des scores avec tableau détaillé
- Mode caméra plein écran avec capture haute résolution (jusqu'à 8K)
- Gestion des parties avec suivi des scores multi-joueurs
- Support PWA (Progressive Web App) pour installation sur mobile
- Interface responsive avec design gradient moderne
- Rotation d'images pour correction d'orientation
- Swiper pour navigation tactile entre les cartes
- Historique et statistiques des parties

### Technical
- Framework Angular 20.3
- TensorFlow.js pour la détection d'objets
- Tailwind CSS 4.1 pour le styling
- Support complet des signals Angular
- Service Worker pour mode offline
- Architecture standalone components
