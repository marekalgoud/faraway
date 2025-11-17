import { Component, signal, ViewChild, ElementRef, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormBuilder, FormControl } from '@angular/forms';
import { CARD_COLOR_CLASSES, CARD_CONDITION_CLASSES, CARD_MULTIPLIER_CLASSES, CARD_VALUE_CLASSES } from '../../constants';

// Interface pour stocker les résultats de l'analyse simplifiée
interface ElementDetection {
  className: string;
  score: number;
}

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './card.html',
  styles: []
})
export class Card {

  cardForm = input.required<FormGroup>();
  cardUrl = input.required<string|null>();
  cardIndex = input<number|null>();

  // Références aux éléments du DOM pour le dessin des boîtes
  @ViewChild('cardImage') cardImage!: ElementRef<HTMLImageElement>;

  // --- NOUVEAUX ÉTATS POUR L'AFFICHAGE ---
  // Affiche/Masque le formulaire de modification
  isEditing = signal(false);
  // Indique si la détection du second modèle est terminée
  isAnalysisComplete = signal(false);
  // ----------------------------------------

  // État existant: Liste des éléments détectés (simplifiée pour le résumé)
  analyzedElements = signal<ElementDetection[]>([]);

  // Listes des options pour les <select> du template
  colorOptions = CARD_COLOR_CLASSES.sort();
  valueOptions = CARD_VALUE_CLASSES.sort();
  conditionOptions = CARD_CONDITION_CLASSES.sort();
  multiplierOptions = CARD_MULTIPLIER_CLASSES.sort();

  private colorBgMap: Record<string, string> = {
    'red': 'bg-red-100',
    'blue': 'bg-blue-100',
    'green': 'bg-green-100',
    'yellow': 'bg-yellow-100',
  };

  cardBgClass = computed(() => {
    const color = this.cardForm().get('color')?.value;
    if (!color) return 'bg-gray-200';
    const normalizedColor = this.formatLabel(color).toLowerCase();
    return this.colorBgMap[normalizedColor] || 'bg-gray-200';
  });

  // Helpers pour accéder facilement aux parties du formulaire
  get optionsGroup(): FormGroup {
    return this.cardForm().get('options') as FormGroup;
  }

  get conditionsArray(): FormArray<FormControl<string|null>> {
    return this.cardForm().get('conditions') as FormArray<FormControl<string|null>>;
  }

  // Fonctions de formulaire (inchangées)
  addCondition() {
    this.conditionsArray.push(new FormControl(null, { nonNullable: true }));
  }

  removeCondition(index: number) {
    this.conditionsArray.removeAt(index);
  }

  /**
   * Bascule entre l'affichage du résumé (boîtes) et du formulaire.
   */
  toggleEdit() {
    this.isEditing.update(editing => !editing);
  }

  formatLabel(label: string | null): string {
    if (!label) return '—';

    return label
      .replace(/^card_/, '')
      .replace(/^value_/, '')
      .replace(/^each_/, '')
      .replace(/^condition_/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .join(' ');
  }

}
