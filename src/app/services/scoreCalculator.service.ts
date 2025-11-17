import { Injectable } from '@angular/core';

// --- (Importez vos constantes depuis le nouveau fichier) ---
import {
  CARD_COLOR_CLASSES,
  CARD_OPTION_CLASSES,
  TEMPLE_COLOR_CLASSES
} from '../constants';

// Interface pour le résultat
export interface ScoreCalculation {
  score: number;
  details: string[];
}

// Interface minimale pour les objets comptés
interface CountableItem {
  color?: string;
  options?: { [key: string]: boolean };
}

@Injectable({
  providedIn: 'root'
})
export class ScoreCalculatorService {

  constructor() { }

  /**
   * Fonction principale pour calculer le score total.
   */
  public calculate(allCards: any[], allTemples: any[]): ScoreCalculation {
    const details: string[] = [];
    let score = 0;

    // 1. Calculer le score des cartes (en ordre inverse)
    details.push("--- CALCUL DES CARTES (de droite à gauche) ---");
    let visibleCards: any[] = []; // Cartes déjà vues (celles de droite)

    for (let i = allCards.length - 1; i >= 0; i--) {
      const card = allCards[i];
      const cardName = `Carte ${i + 1}`;
      details.push(`[${cardName}]`);

      const visibleSet = [...visibleCards, ...allTemples];

      let cardValue = this.parseValue(card.value);
      let cardScore = 0;

      // 1a. Vérifier les conditions
      const conditions = (card.conditions || []).filter((c: string) => c);
      const conditionsMet = this.checkConditions(conditions, visibleSet, details, cardName);

      if (!conditionsMet) {
        cardValue = 0;
        details.push(` -> Conditions non remplies. Valeur annulée.`);
      }

      // 1b. Appliquer le multiplicateur
      if (cardValue > 0 && card.multiplier) {
        const count = this.countMultiplier(card.multiplier, visibleSet);
        cardScore = cardValue * count;
        details.push(` -> Multiplicateur (${card.multiplier}): ${cardValue} x ${count} = ${cardScore}pts`);
      } else {
        cardScore = cardValue;
        details.push(` -> Score de base: ${cardScore}pts`);
      }

      score += cardScore;
      visibleCards.push(card);
    }

    // 2. Calculer le score des temples
    details.push("--- CALCUL DES TEMPLES ---");
    const visibleSetForTemples = [...allCards];

    for (let i = 0; i < allTemples.length; i++) {
      const temple = allTemples[i];
      const templeName = `Temple ${i + 1}`;
      details.push(`[${templeName}]`);

      let templeValue = this.parseValue(temple.value);
      let templeScore = 0;

      if (templeValue > 0 && temple.multiplier) {
        const count = this.countMultiplier(temple.multiplier, visibleSetForTemples);
        templeScore = templeValue * count;
        details.push(` -> Multiplicateur (${temple.multiplier}): ${templeValue} x ${count} = ${templeScore}pts`);
      } else {
        templeScore = templeValue;
        details.push(` -> Score de base: ${templeScore}pts`);
      }

      score += templeScore;
    }

    details.push("---------------------------------");
    details.push(`SCORE TOTAL: ${score}`);

    return { score, details };
  }

  /**
   * Convertit un nom de classe 'value_X' en nombre X.
   */
  private parseValue(valueClass: string): number {
    if (!valueClass) return 0;
    return parseInt(valueClass.replace('value_', ''), 10) || 0;
  }

  /**
   * Compte tous les éléments "visibles" (couleurs, options) dans un ensemble donné.
   */
  private countAllVisibleItems(visibleSet: CountableItem[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    for (const item of visibleSet) {
      // Compter la couleur
      if (item.color) {
        counts[item.color] = (counts[item.color] || 0) + 1;
      }
      // Compter les options (gem, chimera, etc.)
      if (item.options) {
        for (const optName in item.options) {
          if (item.options[optName]) { // Si la checkbox est cochée
            counts[optName] = (counts[optName] || 0) + 1;
          }
        }
      }
    }
    return counts;
  }

  /**
   * Vérifie si les conditions d'une carte sont remplies par l'ensemble visible.
   */
  private checkConditions(conditions: string[], visibleSet: CountableItem[], details: string[], cardName: string): boolean {
    if (conditions.length === 0) return true;

    const requiredCounts: { [key: string]: number } = {};
    for (const cond of conditions) {
      const targetName = cond.replace('condition_', ''); // 'condition_gem' -> 'gem'
      requiredCounts[targetName] = (requiredCounts[targetName] || 0) + 1;
    }

    const visibleCounts = this.countAllVisibleItems(visibleSet);

    for (const targetName in requiredCounts) {
      const required = requiredCounts[targetName];
      const available = visibleCounts[targetName] || 0;

      details.push(` -> Condition: ${targetName} (Requis: ${required}, Disponible: ${available})`);

      if (available < required) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compte le nombre d'occurrences pour un multiplicateur donné dans l'ensemble visible.
   */
  private countMultiplier(multiplierClass: string, visibleSet: CountableItem[]): number {
    const visibleCounts = this.countAllVisibleItems(visibleSet);

    // Mapper les noms de classe 'each_X' aux noms comptés
    switch (multiplierClass) {
      // Options
      case 'each_gem': return visibleCounts['gem'] || 0;
      case 'each_chimera': return visibleCounts['chimera'] || 0;
      case 'each_hint': return visibleCounts['hint'] || 0;
      case 'each_night': return visibleCounts['night'] || 0;
      case 'each_thistle': return visibleCounts['thistle'] || 0;
      // Couleurs
      case 'each_blue': return visibleCounts['card_blue'] || 0;
      case 'each_green': return visibleCounts['card_green'] || 0;
      case 'each_red': return visibleCounts['card_red'] || 0;
      // Combinaisons
      case 'each_yellow_or_blue':
        return (visibleCounts['card_yellow'] || 0) + (visibleCounts['card_blue'] || 0);
      case 'each_yellow_or_green':
        return (visibleCounts['card_yellow'] || 0) + (visibleCounts['card_green'] || 0);
      case 'each_yellow_or_red':
        return (visibleCounts['card_yellow'] || 0) + (visibleCounts['card_red'] || 0);
      case 'each_blue_or_yellow':
        return (visibleCounts['card_blue'] || 0) + (visibleCounts['card_yellow'] || 0);
      case 'each_all_colors':
        return (visibleCounts['card_blue'] || 0) +
               (visibleCounts['card_green'] || 0) +
               (visibleCounts['card_red'] || 0) +
               (visibleCounts['card_yellow'] || 0);
      default:
        return 0;
    }
  }
}
