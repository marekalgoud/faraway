import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TensorflowService } from '../../services/tensorFlow.service'; // Assurez-vous du chemin

// Classes du modèle d'analyse de cartes (Mise à jour pour les 43 classes du metadata.yaml)
const ELEMENT_CLASS_NAMES = [
  'card_blue', // 0
  'card_green', // 1
  'card_red', // 2
  'card_yellow', // 3
  'chimera', // 4
  'condition_chimera', // 5
  'condition_gem', // 6
  'condition_thistle', // 7
  'each_all_colors', // 8
  'each_blue', // 9
  'each_chimera', // 10
  'each_gem', // 11
  'each_green', // 12
  'each_hint', // 13
  'each_night', // 14
  'each_red', // 15
  'each_thistle', // 16
  'each_yellow_or_blue', // 17
  'each_yellow_or_green', // 18
  'each_yellow_or_red', // 19
  'gem', // 20
  'hint', // 21
  'night', // 22
  'thistle', // 23
  'value_1', // 24
  'value_10', // 25
  'value_12', // 26
  'value_13', // 27
  'value_14', // 28
  'value_15', // 29
  'value_16', // 30
  'value_17', // 31
  'value_18', // 32
  'value_19', // 33
  'value_2', // 34
  'value_20', // 35
  'value_24', // 36
  'value_3', // 37
  'value_4', // 38
  'value_5', // 39
  'value_7', // 40
  'value_8', // 41
  'value_9' // 42
];

// Interface pour stocker les résultats de l'analyse
interface ElementDetection {
  className: string;
  score: number;
}


@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styles: []
})
export class Card {
  // Entrée de l'URL de l'image (Data URL)
  @Input({ required: true }) cardUrl!: string;

  private tfService = inject(TensorflowService);

  // Constantes pour le modèle d'élément
  private readonly MODEL_NAME = 'CARD_MODEL';
  private readonly ELEMENT_SCORE_THRESHOLD = 0.2; // Seuil de 20% pour les éléments

  // Signals pour l'état et les résultats
  isLoading = signal(true);
  analyzedElements = signal<ElementDetection[]>([]);

  /**
   * Lance la détection du second modèle sur l'image découpée.
   */
  async analyzeCard(imageElement: HTMLImageElement) {
    this.isLoading.set(true);

    // S'assurer que le modèle est chargé (le composant parent doit l'avoir initié)
    // Ici, nous supposons que le modèle a été chargé une fois par le composant parent.

    try {
      // Le service est maintenant capable de prendre un élément <img>
      const results = await this.tfService.detect(imageElement, this.ELEMENT_SCORE_THRESHOLD, this.MODEL_NAME);

      if (results && results.boxes.length > 0) {
        const elements: ElementDetection[] = [];

        // Parcourir les résultats et les mapper aux noms de classe
        for (let i = 0; i < results.boxes.length; i++) {
          const classId = results.classes[i];
          const score = results.scores[i];

          // Le tableau ELEMENT_CLASS_NAMES est mis à jour et peut contenir jusqu'à 43 indices (0 à 42)
          if (ELEMENT_CLASS_NAMES[classId]) {
            elements.push({
              className: ELEMENT_CLASS_NAMES[classId],
              score: score
            });
          }
        }

        // Trier par score décroissant pour afficher les éléments les plus probables en premier
        elements.sort((a, b) => b.score - a.score);

        this.analyzedElements.set(elements);

      } else {
        this.analyzedElements.set([]);
      }

    } catch (e) {
      console.error("Erreur d'analyse de la carte:", e);
      this.analyzedElements.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}