import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormBuilder, FormControl } from '@angular/forms';

// Classes du modèle d'analyse de cartes (pour les listes déroulantes)
const COLOR_CLASSES = ['card_blue', 'card_green', 'card_red', 'card_yellow'];
const VALUE_CLASSES = [
  'value_1', 'value_10', 'value_12', 'value_13', 'value_14', 'value_15',
  'value_16', 'value_17', 'value_18', 'value_19', 'value_2', 'value_20',
  'value_24', 'value_3', 'value_4', 'value_5', 'value_7', 'value_8', 'value_9'
].sort(); // Trier pour l'affichage
const CONDITION_CLASSES = ['condition_chimera', 'condition_gem', 'condition_thistle'];
const MULTIPLIER_CLASSES = [
  'each_all_colors', 'each_blue', 'each_chimera', 'each_gem', 'each_green',
  'each_hint', 'each_night', 'each_red', 'each_thistle', 'each_yellow_or_blue',
  'each_yellow_or_green', 'each_yellow_or_red'
].sort(); // Trier pour l'affichage
// Les 'Options' sont gérées par des booléens fixes

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
  colorOptions = COLOR_CLASSES;
  valueOptions = VALUE_CLASSES;
  conditionOptions = CONDITION_CLASSES;
  multiplierOptions = MULTIPLIER_CLASSES;

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