import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormControl } from '@angular/forms';

// Classes du modèle d'analyse de cartes (pour les listes déroulantes)
const COLOR_CLASSES = ['card_blue', 'card_green', 'card_red', 'card_yellow'];
const VALUE_CLASSES = [
  'value_1',  'value_2', 'value_5'
].sort(); // Trier pour l'affichage
const MULTIPLIER_CLASSES = [
  'each_all_colors', 'each_blue', 'each_chimera', 'each_gem', 'each_green',
  'each_hint', 'each_night', 'each_red', 'each_thistle', 'each_yellow_or_blue',
  'each_yellow_or_green', 'each_yellow_or_red', 'each_blue_or_yellow'
].sort(); // Trier pour l'affichage
// Les 'Options' sont gérées par un array maintenant



@Component({
  selector: 'app-temple',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Ajout de ReactiveFormsModule
  templateUrl: './temple.html',
  styles: []
})
export class Temple {
  // Le FormGroup est maintenant passé en @Input
  @Input({ required: true }) templeForm!: FormGroup;
  @Input({ required: true }) templeUrl!: string;

  // Listes des options pour les <select> du template
  colorOptions = COLOR_CLASSES;
  valueOptions = VALUE_CLASSES;
  multiplierOptions = MULTIPLIER_CLASSES;
  optionsList = ['chimera', 'gem', 'hint', 'night', 'thistle'];

  // Helpers pour accéder facilement aux parties du formulaire dans le template
  get optionsArray(): FormArray<FormControl<string|null>> {
    return this.templeForm.get('options') as FormArray<FormControl<string|null>>;
  }

  addOption() {
    this.optionsArray.push(new FormControl(null, { nonNullable: true }));
  }

  removeOption(index: number) {
    this.optionsArray.removeAt(index);
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
