import { Component, signal, ElementRef, input, computed, output, inject, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormControl } from '@angular/forms';
import { CARD_COLOR_CLASSES, CARD_CONDITION_CLASSES, CARD_MULTIPLIER_CLASSES, CARD_VALUE_CLASSES, CARD_OPTION_CLASSES, type CardOption } from '../../constants';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { FormatterService } from '../../services/formatter.service';

// Interface pour stocker les résultats de l'analyse simplifiée
interface ElementDetection {
  className: string;
  score: number;
}

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './card.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Card {
  private formatterService = inject(FormatterService);

  cardForm = input.required<FormGroup>();
  cardUrl = input.required<string|null>();
  cardIndex = input<number|null>();

  // Output pour signaler la suppression au parent
  deleteCard = output<number>();

  // Références aux éléments du DOM pour le dessin des boîtes
  cardImage = viewChild<ElementRef<HTMLImageElement>>('cardImage');

  // --- NOUVEAUX ÉTATS POUR L'AFFICHAGE ---
  // Affiche/Masque le formulaire de modification
  isEditing = signal(false);
  // Indique si la détection du second modèle est terminée
  isAnalysisComplete = signal(false);
  // ----------------------------------------

  // État existant: Liste des éléments détectés (simplifiée pour le résumé)
  analyzedElements = signal<ElementDetection[]>([]);

  // Listes des options pour les <select> du template
  colorOptions = CARD_COLOR_CLASSES.toSorted();
  valueOptions = CARD_VALUE_CLASSES.toSorted((a, b) => {
    const na = parseInt((a || '').replace(/\D/g, ''), 10) || 0;
    const nb = parseInt((b || '').replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });
  conditionOptions = CARD_CONDITION_CLASSES.toSorted();
  multiplierOptions = CARD_MULTIPLIER_CLASSES.toSorted();
  optionsList: readonly CardOption[] = CARD_OPTION_CLASSES;

  private colorBgMap: Record<string, string> = {
    'red': 'bg-red-100',
    'blue': 'bg-blue-100',
    'green': 'bg-green-100',
    'yellow': 'bg-yellow-100',
  };

  cardBgClass = computed(() => {
    const color = this.selectedColor();
    if (!color) return 'bg-gray-200';
    const normalizedColor = this.formatterService.formatLabel(color, 'card').toLowerCase();
    return this.colorBgMap[normalizedColor] || 'bg-gray-200';
  });

  // Signal to reflect current color control value
  private selectedColor = computed(() => {
    const fg = this.cardForm();
    if (!fg) return '';
    const ctrl = fg.get('color') as FormControl | null;
    if (!ctrl) return '';
    return toSignal(ctrl.valueChanges, { initialValue: ctrl.value || '' })() || '';
  });

  // Helpers pour accéder facilement aux parties du formulaire
  get optionsArray(): FormArray<FormControl<string|null>> {
    return this.cardForm().get('options') as FormArray<FormControl<string|null>>;
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

  addOption() {
    this.optionsArray.push(new FormControl(null, { nonNullable: true }));
  }

  removeOption(index: number) {
    this.optionsArray.removeAt(index);
  }

  /**
   * Bascule entre l'affichage du résumé (boîtes) et du formulaire.
   */
  toggleEdit() {
    this.isEditing.update(editing => !editing);
  }

  /**
   * Émet un signal au parent pour supprimer cette carte.
   */
  onDelete() {
    const idx = this.cardIndex();
    if (idx !== null && idx !== undefined) {
      this.deleteCard.emit(idx);
    }
  }
  /**
   * Formate le label pour l'affichage (avec traduction)
   */
  formatLabel(label: string | null): string {
    return this.formatterService.formatLabel(label, 'card');
  }

  /**
   * Formate le label pour les noms d'images (sans traduction)
   */
  formatLabelImage(label: string | null): string {
    return this.formatterService.formatLabelImage(label);
  }

}
