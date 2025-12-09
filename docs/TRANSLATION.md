# Système de Traduction

## Vue d'ensemble

Le système de traduction utilise des signals Angular pour gérer les changements de langue de manière réactive. Il supporte actuellement le français (fr) et l'anglais (en).

## Utilisation

### Dans les templates (HTML)

Utilisez le pipe `translate` :

```html
<!-- Simple traduction -->
<h1>{{ 'home.title' | translate }}</h1>

<!-- Avec paramètres -->
<p>{{ 'imageDetector.analyzingCards' | translate: {count: 8} }}</p>
```

### Dans les composants (TypeScript)

Injectez le `TranslationService` :

```typescript
import { inject } from '@angular/core';
import { TranslationService } from './services/translation.service';

export class MyComponent {
  protected translationService = inject(TranslationService);
  
  // Obtenir la langue courante
  currentLang = this.translationService.language();
  
  // Changer la langue
  changeLanguage() {
    this.translationService.setLanguage('en');
  }
  
  // Traduire directement
  getTranslation() {
    return this.translationService.translate('common.home');
  }
}
```

### Imports nécessaires

Dans votre composant :

```typescript
import { TranslatePipe } from './pipes/translate.pipe';

@Component({
  imports: [TranslatePipe, /* autres imports */]
})
```

## Structure des traductions

Les traductions sont organisées par domaine dans `src/app/services/translation.service.ts` :

```typescript
{
  common: { ... },      // Commun à toute l'app
  footer: { ... },      // Footer
  home: { ... },        // Page d'accueil
  imageDetector: { ... }, // Détecteur d'images
  card: { ... },        // Composant carte
  temple: { ... },      // Composant temple
  score: { ... }        // Page des scores
}
```

## Traduction des valeurs de cartes et temples

Le service inclut une méthode spéciale `translateFormatted()` pour traduire automatiquement les valeurs formatées :

```typescript
// Dans un composant
formatLabel(label: string | null): string {
  if (!label) return '—';
  
  const formatted = label
    .replace(/^card_/, '')
    .replace(/^value_/, '')
    .replace(/^each_/, '')
    .replace(/_/g, ' ');
  
  // Traduit automatiquement selon le contexte
  return this.translationService.translateFormatted(formatted, 'card');
}
```

Cette méthode traduit automatiquement :
- Les couleurs (blue → Bleu/Blue)
- Les valeurs (1, 2, 3, etc.)
- Les multiplicateurs (all colors → Toutes couleurs/All colors)
- Les options (chimera → Chimère/Chimera)
- Les conditions (gem → Gemme/Gem)

## Ajouter de nouvelles traductions

1. Ouvrez `src/app/services/translation.service.ts`
2. Ajoutez vos clés dans les objets `fr` et `en`
3. Utilisez-les dans vos templates avec le pipe `translate`

Exemple :

```typescript
// Dans translation.service.ts
fr: {
  myPage: {
    greeting: 'Bonjour {name} !'
  }
},
en: {
  myPage: {
    greeting: 'Hello {name}!'
  }
}

// Dans votre template
<p>{{ 'myPage.greeting' | translate: {name: userName} }}</p>
```

## Changement de langue

Le sélecteur de langue est disponible dans le footer. La langue choisie est automatiquement sauvegardée dans le localStorage.

## Paramètres dynamiques

Vous pouvez passer des paramètres à vos traductions :

```typescript
// Traduction avec placeholder
'imageDetector.analyzingCards': 'Analyse de {count} carte(s)...'

// Utilisation
{{ 'imageDetector.analyzingCards' | translate: {count: cardCount} }}
```
