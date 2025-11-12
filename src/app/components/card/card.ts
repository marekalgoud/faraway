import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TensorflowService, DetectionResult } from '../../services/tensorFlow.service'; // Assurez-vous du chemin

// Classes du modèle d'analyse de cartes (selon votre metadata.yaml du second modèle)
const ELEMENT_CLASS_NAMES = [
  'blue_card', // 0
  'chimera',   // 1
  'gem',       // 2
  'green_card', // 3
  'hint',      // 4
  'night',     // 5
  'red_card',  // 6
  'thistle',   // 7
  'yellow_card' // 8
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
  template: `
    <div class="flex flex-col items-center bg-gray-50 p-3 rounded-lg shadow-md border border-gray-200">

      <img #cardImage
           [src]="cardUrl"
           alt="Carte découpée"
           (load)="analyzeCard(cardImage)"
           class="max-h-32 shadow-lg border-2 border-indigo-300 rounded-lg object-contain mb-2"
           crossOrigin="anonymous"
      >

      <div *ngIf="!isLoading()" class="text-xs w-full">
        <p *ngIf="analyzedElements().length === 0" class="text-red-500 font-semibold text-center">
            Aucun élément trouvé (&lt; 20%)
        </p>
        <div *ngFor="let element of analyzedElements()" class="flex justify-between items-center my-0.5">
          <span class="font-medium text-gray-700">{{ element.className | slice:0:15 }}</span>
          <span class="font-bold" [ngClass]="{'text-green-600': element.score > 0.5, 'text-orange-500': element.score <= 0.5}">
            {{ (element.score * 100) | number:'1.0-0' }}%
          </span>
        </div>
      </div>

      <div *ngIf="isLoading()" class="text-xs text-indigo-600 font-medium py-3">
        Analyse...
      </div>
    </div>
  `,
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