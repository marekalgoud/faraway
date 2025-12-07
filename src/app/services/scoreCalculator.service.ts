import { Injectable } from '@angular/core';

// Interface pour un round de calcul
export interface ScoreRound {
  round: string;
  score: number;
  details: string;
}

// Interface pour le résultat
export interface ScoreCalculation {
  score: number;
  rounds: ScoreRound[];
  details: string[];
}

// Interface minimale pour les objets comptés
interface CountableItem {
  color?: string;
  options?: string[];
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
    const rounds: ScoreRound[] = [];
    let score = 0;

    // 1. Calculer le score des cartes (en ordre inverse)
    let visibleCards: any[] = []; // Cartes déjà vues (celles de droite)

    for (let i = allCards.length - 1; i >= 0; i--) {
      const card = allCards[i];
      const roundNumber = allCards.length - i;
      const cardDetails: string[] = [];

      // Include the card itself in the visible set for multiplier calculation
      const visibleSet = [card, ...visibleCards, ...allTemples];

      let cardValue = this.parseValue(card.value);
      let cardScore = 0;

      // 1a. Vérifier les conditions
      const conditions = (card.conditions || []).filter((c: string) => c);
      const conditionsMet = this.checkConditions(conditions, visibleSet, cardDetails, `Carte ${i + 1}`);

      if (!conditionsMet) {
        cardValue = 0;
        cardDetails.push(`Conditions non remplies`);
      }

      // 1b. Appliquer le multiplicateur
      if (cardValue > 0 && card.multiplier) {
        const count = this.countMultiplier(card.multiplier, visibleSet);
        cardScore = cardValue * count;
        cardDetails.push(`${cardValue} x ${count} = ${cardScore}pts`);
      } else {
        cardScore = cardValue;
        cardDetails.push(`Score de base: ${cardScore}pts`);
      }

      score += cardScore;
      visibleCards.push(card);

      // Ajouter le round
      rounds.push({
        round: `${roundNumber}`,
        score: cardScore,
        details: cardDetails.join(' | ')
      });

      // Garder aussi l'ancien format pour compatibilité
      details.push(`[Carte ${i + 1}]`);
      cardDetails.forEach(d => details.push(` -> ${d}`));
    }

    // 2. Calculer le score des temples
    const visibleSetForTemples = [...allCards, ...allTemples];
    let templesScore = 0;
    const templesDetails: string[] = [];

    for (let i = 0; i < allTemples.length; i++) {
      const temple = allTemples[i];
      const templeInfo: string[] = [];

      let templeValue = this.parseValue(temple.value);
      let templeScore = 0;

      if (templeValue > 0 && temple.multiplier) {
        const count = this.countMultiplier(temple.multiplier, visibleSetForTemples);
        templeScore = templeValue * count;
        templeInfo.push(`T${i + 1}: ${templeValue} x ${count} = ${templeScore}pts`);
      } else {
        templeScore = templeValue;
        templeInfo.push(`T${i + 1}: ${templeScore}pts`);
      }

      templesScore += templeScore;
      templesDetails.push(templeInfo.join(''));

      // Ancien format
      details.push(`[Temple ${i + 1}]`);
      details.push(` -> Score: ${templeScore}pts`);
    }

    score += templesScore;

    // Ajouter le round des temples
    rounds.push({
      round: 'Temples',
      score: templesScore,
      details: templesDetails.join(' | ')
    });

    details.push("---------------------------------");
    details.push(`SCORE TOTAL: ${score}`);

    return { score, rounds, details };
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
      // Compter les options (gem, chimera, etc.) - maintenant c'est un array
      if (item.options && Array.isArray(item.options)) {
        for (const optName of item.options) {
          counts[optName] = (counts[optName] || 0) + 1;
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
      case 'each_yellow': return visibleCounts['card_yellow'] || 0;
      case 'each_green': return visibleCounts['card_green'] || 0;
      case 'each_red': return visibleCounts['card_red'] || 0;
      // Combinaisons
      case 'each_yellow_or_blue':
      case 'each_blue_or_yellow':
        return (visibleCounts['card_yellow'] || 0) + (visibleCounts['card_blue'] || 0);
      case 'each_yellow_or_green':
      case 'each_green_or_yellow':
        return (visibleCounts['card_yellow'] || 0) + (visibleCounts['card_green'] || 0);
      case 'each_yellow_or_red':
      case 'each_red_or_yellow':
        return (visibleCounts['card_yellow'] || 0) + (visibleCounts['card_red'] || 0);
      case 'each_green_or_blue':
      case 'each_blue_or_green':
        return (visibleCounts['card_green'] || 0) + (visibleCounts['card_blue'] || 0);
      case 'each_green_or_red':
      case 'each_red_or_green':
        return (visibleCounts['card_green'] || 0) + (visibleCounts['card_red'] || 0);
      case 'each_red_or_blue':
      case 'each_blue_or_red':
        return (visibleCounts['card_red'] || 0) + (visibleCounts['card_blue'] || 0);
      case 'each_all_colors':
        // Count how many full sets of the four standard colors exist.
        // Example: if counts are {blue:2, red:2, green:2, yellow:2} -> return 2
        const b = visibleCounts['card_blue'] || 0;
        const g = visibleCounts['card_green'] || 0;
        const r = visibleCounts['card_red'] || 0;
        const y = visibleCounts['card_yellow'] || 0;
        return Math.min(b, g, r, y);
      default:
        return 0;
    }
  }
}
