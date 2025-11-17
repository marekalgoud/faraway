import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormBuilder, FormControl } from '@angular/forms';
import { CARD_COLOR_CLASSES, CARD_CONDITION_CLASSES, CARD_MULTIPLIER_CLASSES, CARD_VALUE_CLASSES } from '../../constants';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Ajout de ReactiveFormsModule
  templateUrl: './card.html',
  styles: []
})
export class Card {
  // Le FormGroup est maintenant passé en @Input
  @Input({ required: true }) cardForm!: FormGroup;
  @Input({ required: true }) cardUrl!: string;

  private fb = inject(FormBuilder);

  // Listes des options pour les <select> du template
  colorOptions = CARD_COLOR_CLASSES.sort();
  valueOptions = CARD_VALUE_CLASSES.sort();
  conditionOptions = CARD_CONDITION_CLASSES.sort();
  multiplierOptions = CARD_MULTIPLIER_CLASSES.sort();

  // Helpers pour accéder facilement aux parties du formulaire dans le template
  get optionsGroup(): FormGroup {
    return this.cardForm.get('options') as FormGroup;
  }

  get conditionsArray(): FormArray<FormControl<string|null>> {
    return this.cardForm.get('conditions') as FormArray<FormControl<string|null>>;
  }

  // Fonctions pour manipuler le FormArray 'conditions'

  /**
   * Ajoute une nouvelle condition vide au FormArray
   */
  addCondition() {
    this.conditionsArray.push(this.fb.control('')); // Ajoute un FormControl vide
  }

  /**
   * Retire une condition à un index spécifique
   */
  removeCondition(index: number) {
    this.conditionsArray.removeAt(index);
  }
}