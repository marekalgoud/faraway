import { Injectable, signal, computed } from '@angular/core';

export type Language = 'fr' | 'en';

export interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
  fr: {
    common: {
      home: 'Accueil',
      score: 'Scores',
      loading: 'Chargement',
      error: 'Erreur',
      warning: 'Attention',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      save: 'Enregistrer',
      close: 'Fermer'
    },
    pwa: {
      offlineMode: 'Mode hors ligne - Certaines fonctionnalités peuvent être limitées',
      updateAvailable: 'Mise à jour disponible !',
      updateNow: 'Mettre à jour maintenant',
      installTitle: 'Installer Faraway',
      installDesc: 'Accès rapide et utilisation hors ligne !',
      install: 'Installer',
      loadingModels: 'Chargement des modèles IA'
    },
    footer: {
      version: 'v'
    },
    home: {
      title: 'Bienvenue sur Faraway',
      subtitle: 'Calculateur de score et détecteur d\'images',
      resumeGame: 'Reprendre la partie en cours',
      newGame: 'Créer une nouvelle partie',
      goToDetection: 'Aller à la détection',
      players: 'Joueurs (2-6)',
      addPlayer: 'Ajouter un joueur',
      startGame: 'Démarrer la partie',
      playerPlaceholder: 'Joueur',
      manualEntry: 'Saisie Manuelle',
      manualEntryDesc: 'Entrez vos cartes et temples manuellement',
      imageDetection: 'Détection d\'Image',
      imageDetectionDesc: 'Analysez une photo de votre jeu avec l\'IA',
      viewScores: 'Voir les Scores',
      viewScoresDesc: 'Consultez l\'historique de vos scores'
    },
    imageDetector: {
      title: 'Détecteur de Scène & Analyse de Cartes',
      openCamera: 'Ouvrir Caméra',
      closeCamera: 'Fermer Caméra',
      capturePhoto: 'Capturer Photo',
      detectObjects: 'Détecter Objets',
      rotation: 'Rotation',
      demoImage: 'Image Démo',
      loadingModels: 'Chargement des modèles de détection...',
      imageSelected: 'Image sélectionnée...',
      photoCaptured: 'Photo capturée...',
      imageLoaded: 'Image chargée. Prêt à détecter.',
      detectingScene: 'Détection de la scène...',
      croppingObjects: 'Découpage des objets...',
      analyzingCards: 'Analyse de {count} carte(s)...',
      analyzingTemples: 'Analyse de {count} temple(s)...',
      analysisComplete: 'Analyse terminée !',
      detectionError: 'Erreur de détection.',
      placeholder: 'Veuillez sélectionner une image ou ouvrir la caméra.',
      cards: 'Cartes',
      temples: 'Temples',
      calculateScore: 'Calculer le Score',
      calculationDetails: 'Détail du Calcul',
      round: 'Round',
      detail: 'Détail du calcul',
      totalScore: 'Score Total',
      errorMinCards: 'Erreur : Seulement {count} carte(s) détectée(s). 8 cartes minimum requises.',
      warningMaxCards: 'Attention : {count} cartes ont été détectées (au lieu de 8).',
      cameraError: 'Impossible d\'accéder à la caméra. Vérifiez les permissions.'
    },
    card: {
      detected: 'carte détectée',
      modify: 'Modifier',
      validate: 'Valider',
      delete: 'Supprimer cette carte',
      unavailable: 'Aperçu indisponible',
      color: 'Couleur',
      value: 'Valeur',
      multiplier: 'Multiplicateur',
      options: 'Options',
      conditions: 'Conditions',
      addOption: 'Ajouter une Option',
      addCondition: 'Ajouter une Condition',
      none: 'Aucune',
      noMultiplier: 'Aucun',
      select: 'Sélectionner',
      colors: {
        blue: 'Bleu',
        green: 'Vert',
        red: 'Rouge',
        yellow: 'Jaune',
        gray: 'Gris'
      },
      values: {
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
        '7': '7',
        '8': '8',
        '9': '9',
        '10': '10',
        '12': '12',
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
        '17': '17',
        '18': '18',
        '19': '19',
        '20': '20',
        '24': '24'
      },
      multipliers: {
        'all colors': 'Toutes couleurs',
        'blue': 'Bleu',
        'chimera': 'Chimère',
        'gem': 'Gemme',
        'green': 'Vert',
        'hint': 'Indice',
        'night': 'Nuit',
        'red': 'Rouge',
        'thistle': 'Chardon',
        'yellow or blue': 'Jaune ou Bleu',
        'yellow or green': 'Jaune ou Vert',
        'yellow or red': 'Jaune ou Rouge',
        'blue or yellow': 'Bleu ou Jaune',
        'green or blue': 'Vert ou Bleu',
        'green or red': 'Vert ou Rouge',
        'red or blue': 'Rouge ou Bleu',
        'red or yellow': 'Rouge ou Jaune',
        'yellow': 'Jaune'
      },
      optionsList: {
        'chimera': 'Chimère',
        'gem': 'Gemme',
        'hint': 'Indice',
        'night': 'Nuit',
        'thistle': 'Chardon'
      },
      conditionsList: {
        'chimera': 'Chimère',
        'gem': 'Gemme',
        'thistle': 'Chardon'
      }
    },
    temple: {
      detected: 'temple détecté',
      modify: 'Modifier',
      validate: 'Valider',
      delete: 'Supprimer ce temple',
      unavailable: 'Aperçu indisponible',
      color: 'Couleur',
      value: 'Valeur',
      multiplier: 'Multiplicateur',
      options: 'Options',
      addOption: 'Ajouter une Option',
      none: 'Aucune',
      noMultiplier: 'Aucun',
      select: 'Sélectionner',
      colors: {
        blue: 'Bleu',
        green: 'Vert',
        red: 'Rouge',
        yellow: 'Jaune',
        gray: 'Gris'
      },
      values: {
        '1': '1',
        '2': '2',
        '4': '4',
        '5': '5'
      },
      multipliers: {
        'all colors': 'Toutes couleurs',
        'blue': 'Bleu',
        'blue or yellow': 'Bleu ou Jaune',
        'chimera': 'Chimère',
        'gem': 'Gemme',
        'green': 'Vert',
        'green or blue': 'Vert ou Bleu',
        'green or red': 'Vert ou Rouge',
        'hint': 'Indice',
        'night': 'Nuit',
        'red': 'Rouge',
        'red or blue': 'Rouge ou Bleu',
        'red or yellow': 'Rouge ou Jaune',
        'thistle': 'Chardon',
        'yellow': 'Jaune',
        'yellow or green': 'Jaune ou Vert'
      },
      optionsList: {
        'chimera': 'Chimère',
        'gem': 'Gemme',
        'hint': 'Indice',
        'night': 'Nuit',
        'thistle': 'Chardon'
      }
    },
    score: {
      title: 'Tableau des Scores',
      round: 'Round',
      wins: 'Victoires',
      addRound: 'Ajouter un round',
      goToDetection: 'Aller à la détection',
      noScores: 'Aucun score enregistré',
      date: 'Date',
      score: 'Score',
      details: 'Détails',
      delete: 'Supprimer',
      deleteAll: 'Tout Supprimer',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce score ?',
      confirmDeleteAll: 'Êtes-vous sûr de vouloir supprimer tous les scores ?',
      calculation: {
        card: 'Carte',
        temple: 'Temple',
        temples: 'Temples',
        conditionsNotMet: 'Conditions non remplies',
        baseScore: 'Score de base',
        condition: 'Condition',
        required: 'Requis',
        available: 'Disponible',
        total: 'SCORE TOTAL'
      }
    }
  },
  en: {
    common: {
      home: 'Home',
      score: 'Scores',
      loading: 'Loading',
      error: 'Error',
      warning: 'Warning',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      save: 'Save',
      close: 'Close'
    },
    pwa: {
      offlineMode: 'Offline mode - Some features may be limited',
      updateAvailable: 'Update available!',
      updateNow: 'Update now',
      installTitle: 'Install Faraway',
      installDesc: 'Quick access and offline use!',
      install: 'Install',
      loadingModels: 'Loading AI models'
    },
    footer: {
      version: 'v'
    },
    home: {
      title: 'Welcome to Faraway',
      subtitle: 'Score calculator and image detector',
      resumeGame: 'Resume current game',
      newGame: 'Create new game',
      goToDetection: 'Go to detection',
      players: 'Players (2-6)',
      addPlayer: 'Add player',
      startGame: 'Start game',
      playerPlaceholder: 'Player',
      manualEntry: 'Manual Entry',
      manualEntryDesc: 'Enter your cards and temples manually',
      imageDetection: 'Image Detection',
      imageDetectionDesc: 'Analyze a photo of your game with AI',
      viewScores: 'View Scores',
      viewScoresDesc: 'Check your score history'
    },
    imageDetector: {
      title: 'Scene Detector & Card Analysis',
      openCamera: 'Open Camera',
      closeCamera: 'Close Camera',
      capturePhoto: 'Capture Photo',
      detectObjects: 'Detect Objects',
      rotation: 'Rotation',
      demoImage: 'Demo Image',
      loadingModels: 'Loading detection models...',
      imageSelected: 'Image selected...',
      photoCaptured: 'Photo captured...',
      imageLoaded: 'Image loaded. Ready to detect.',
      detectingScene: 'Detecting scene...',
      croppingObjects: 'Cropping objects...',
      analyzingCards: 'Analyzing {count} card(s)...',
      analyzingTemples: 'Analyzing {count} temple(s)...',
      analysisComplete: 'Analysis complete!',
      detectionError: 'Detection error.',
      placeholder: 'Please select an image or open the camera.',
      cards: 'Cards',
      temples: 'Temples',
      calculateScore: 'Calculate Score',
      calculationDetails: 'Calculation Details',
      round: 'Round',
      detail: 'Calculation detail',
      totalScore: 'Total Score',
      errorMinCards: 'Error: Only {count} card(s) detected. Minimum 8 cards required.',
      warningMaxCards: 'Warning: {count} cards detected (instead of 8).',
      cameraError: 'Unable to access camera. Check permissions.'
    },
    card: {
      detected: 'detected card',
      modify: 'Modify',
      validate: 'Validate',
      delete: 'Delete this card',
      unavailable: 'Preview unavailable',
      color: 'Color',
      value: 'Value',
      multiplier: 'Multiplier',
      options: 'Options',
      conditions: 'Conditions',
      addOption: 'Add Option',
      addCondition: 'Add Condition',
      none: 'None',
      noMultiplier: 'None',
      select: 'Select',
      colors: {
        blue: 'Blue',
        green: 'Green',
        red: 'Red',
        yellow: 'Yellow',
        gray: 'Gray'
      },
      values: {
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
        '7': '7',
        '8': '8',
        '9': '9',
        '10': '10',
        '12': '12',
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
        '17': '17',
        '18': '18',
        '19': '19',
        '20': '20',
        '24': '24'
      },
      multipliers: {
        'all colors': 'All colors',
        'blue': 'Blue',
        'chimera': 'Chimera',
        'gem': 'Gem',
        'green': 'Green',
        'hint': 'Hint',
        'night': 'Night',
        'red': 'Red',
        'thistle': 'Thistle',
        'yellow or blue': 'Yellow or Blue',
        'yellow or green': 'Yellow or Green',
        'yellow or red': 'Yellow or Red',
        'blue or yellow': 'Blue or Yellow',
        'green or blue': 'Green or Blue',
        'green or red': 'Green or Red',
        'red or blue': 'Red or Blue',
        'red or yellow': 'Red or Yellow',
        'yellow': 'Yellow'
      },
      optionsList: {
        'chimera': 'Chimera',
        'gem': 'Gem',
        'hint': 'Hint',
        'night': 'Night',
        'thistle': 'Thistle'
      },
      conditionsList: {
        'chimera': 'Chimera',
        'gem': 'Gem',
        'thistle': 'Thistle'
      }
    },
    temple: {
      detected: 'detected temple',
      modify: 'Modify',
      validate: 'Validate',
      delete: 'Delete this temple',
      unavailable: 'Preview unavailable',
      color: 'Color',
      value: 'Value',
      multiplier: 'Multiplier',
      options: 'Options',
      addOption: 'Add Option',
      none: 'None',
      noMultiplier: 'None',
      select: 'Select',
      colors: {
        blue: 'Blue',
        green: 'Green',
        red: 'Red',
        yellow: 'Yellow',
        gray: 'Gray'
      },
      values: {
        '1': '1',
        '2': '2',
        '4': '4',
        '5': '5'
      },
      multipliers: {
        'all colors': 'All colors',
        'blue': 'Blue',
        'blue or yellow': 'Blue or Yellow',
        'chimera': 'Chimera',
        'gem': 'Gem',
        'green': 'Green',
        'green or blue': 'Green or Blue',
        'green or red': 'Green or Red',
        'hint': 'Hint',
        'night': 'Night',
        'red': 'Red',
        'red or blue': 'Red or Blue',
        'red or yellow': 'Red or Yellow',
        'thistle': 'Thistle',
        'yellow': 'Yellow',
        'yellow or green': 'Yellow or Green'
      },
      optionsList: {
        'chimera': 'Chimera',
        'gem': 'Gem',
        'hint': 'Hint',
        'night': 'Night',
        'thistle': 'Thistle'
      }
    },
    score: {
      title: 'Score Table',
      round: 'Round',
      wins: 'Wins',
      addRound: 'Add round',
      goToDetection: 'Go to detection',
      noScores: 'No saved scores',
      date: 'Date',
      score: 'Score',
      details: 'Details',
      delete: 'Delete',
      deleteAll: 'Delete All',
      confirmDelete: 'Are you sure you want to delete this score?',
      confirmDeleteAll: 'Are you sure you want to delete all scores?',
      calculation: {
        card: 'Card',
        temple: 'Temple',
        temples: 'Temples',
        conditionsNotMet: 'Conditions not met',
        baseScore: 'Base score',
        condition: 'Condition',
        required: 'Required',
        available: 'Available',
        total: 'TOTAL SCORE'
      }
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<Language>('fr');
  
  constructor() {
    // Charger la langue depuis le localStorage
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
      this.currentLanguage.set(savedLang);
    }
  }

  get language() {
    return this.currentLanguage.asReadonly();
  }

  setLanguage(lang: Language) {
    this.currentLanguage.set(lang);
    localStorage.setItem('language', lang);
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage()];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Retourner la clé si non trouvée
      }
    }
    
    let result = typeof value === 'string' ? value : key;
    
    // Remplacer les paramètres {param}
    if (params) {
      Object.keys(params).forEach(param => {
        result = result.replace(`{${param}}`, String(params[param]));
      });
    }
    
    return result;
  }

  // Computed signal pour faciliter l'utilisation dans les composants
  t(key: string, params?: Record<string, string | number>) {
    return computed(() => this.translate(key, params));
  }

  /**
   * Traduit les valeurs formatées des cartes/temples
   * Exemple: formatLabel('card_blue') -> 'blue' -> traduit vers 'Bleu' ou 'Blue'
   */
  translateFormatted(formattedValue: string | null, context: 'card' | 'temple' = 'card'): string {
    if (!formattedValue) return '—';
    
    const normalized = formattedValue.toLowerCase().trim();
    
    // Essayer de traduire depuis les couleurs
    const colorKey = `${context}.colors.${normalized}`;
    let result = this.translate(colorKey);
    if (result !== colorKey) return result;
    
    // Essayer de traduire depuis les valeurs
    const valueKey = `${context}.values.${normalized}`;
    result = this.translate(valueKey);
    if (result !== valueKey) return result;
    
    // Essayer de traduire depuis les multiplicateurs
    const multKey = `${context}.multipliers.${normalized}`;
    result = this.translate(multKey);
    if (result !== multKey) return result;
    
    // Essayer de traduire depuis les options
    const optKey = `${context}.optionsList.${normalized}`;
    result = this.translate(optKey);
    if (result !== optKey) return result;
    
    // Essayer de traduire depuis les conditions (card uniquement)
    if (context === 'card') {
      const condKey = `card.conditionsList.${normalized}`;
      result = this.translate(condKey);
      if (result !== condKey) return result;
    }
    
    // Si aucune traduction trouvée, retourner la valeur formatée originale
    return formattedValue;
  }
}
