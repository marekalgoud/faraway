import { Component, signal, ViewChild, ElementRef, input, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormBuilder, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
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
export class Card implements OnInit, OnDestroy {

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
  valueOptions = CARD_VALUE_CLASSES.sort((a, b) => {
    const na = parseInt((a || '').replace(/\D/g, ''), 10) || 0;
    const nb = parseInt((b || '').replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });
  conditionOptions = CARD_CONDITION_CLASSES.sort();
  multiplierOptions = CARD_MULTIPLIER_CLASSES.sort();
  optionsList = ['chimera', 'gem', 'hint', 'night', 'thistle'];

  private colorBgMap: Record<string, string> = {
    'red': 'bg-red-100',
    'blue': 'bg-blue-100',
    'green': 'bg-green-100',
    'yellow': 'bg-yellow-100',
  };

  cardBgClass = computed(() => {
    const color = this.selectedColor();
    if (!color) return 'bg-gray-200';
    const normalizedColor = this.formatLabel(color).toLowerCase();
    return this.colorBgMap[normalizedColor] || 'bg-gray-200';
  });

  // Signal to reflect current color control value and subscription for cleanup
  private selectedColor = signal<string>('');
  private _subs: Subscription | null = null;

  ngOnInit(): void {
    // If the input FormGroup already has a color control, initialize and subscribe
    const fg = this.cardForm();
    if (!fg) return;
    const ctrl = fg.get('color') as FormControl | null;
    if (ctrl) {
      const initial = ctrl.value as string | null;
      this.selectedColor.set(initial || '');
      this._subs = ctrl.valueChanges?.subscribe((v: any) => this.selectedColor.set(v || '')) ?? null;
    }
  }

  ngOnDestroy(): void {
    if (this._subs) this._subs.unsubscribe();
  }

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
