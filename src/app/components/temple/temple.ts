import { Component, Input, inject, signal, computed, OnInit, OnDestroy, output } from '@angular/core';
import { Subscription } from 'rxjs';

// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormControl } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';

// Classes du modèle d'analyse de temples (basé sur metadata.yaml)
const COLOR_CLASSES = ['card_blue', 'card_gray', 'card_green', 'card_red', 'card_yellow'];
const VALUE_CLASSES = [
  'value_1', 'value_2', 'value_4', 'value_5'
].sort(); // Trier pour l'affichage
const MULTIPLIER_CLASSES = [
  'each_all_colors', 'each_blue', 'each_blue_or_yellow', 'each_chimera', 'each_gem',
  'each_green', 'each_green_or_blue', 'each_green_or_red', 'each_hint', 'each_night',
  'each_red', 'each_red_or_blue', 'each_red_or_yellow', 'each_thistle', 'each_yellow',
  'each_yellow_or_green'
].sort(); // Trier pour l'affichage
// Les 'Options' sont gérées par un array maintenant



@Component({
  selector: 'app-temple',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe], // Ajout de CommonModule + ReactiveFormsModule
  templateUrl: './temple.html',
  styles: []
})
export class Temple implements OnInit, OnDestroy {
  protected translationService = inject(TranslationService);
  
  // Le FormGroup est maintenant passé en @Input
  @Input({ required: true }) templeForm!: FormGroup;
  @Input({ required: true }) templeUrl!: string;
  @Input() templeIndex?: number;

  // Output pour signaler la suppression au parent
  deleteTemple = output<number>();

  // UI state
  isEditing = signal(false);

  private colorBgMap: Record<string, string> = {
    'red': 'bg-red-100',
    'blue': 'bg-blue-100',
    'green': 'bg-green-100',
    'yellow': 'bg-yellow-100',
  };
  // reactive color signal + computed class
  private selectedColor = signal<string>('');
  private _subs: Subscription | null = null;

  templeBgClass = computed(() => {
    const color = this.selectedColor();
    if (!color) return 'bg-gray-200';
    const normalizedColor = this.formatLabel(color).toLowerCase();
    return this.colorBgMap[normalizedColor] || 'bg-gray-200';
  });

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

  ngOnInit(): void {
    if (!this.templeForm) return;
    const ctrl = this.templeForm.get('color') as FormControl | null;
    if (ctrl) {
      this.selectedColor.set((ctrl.value as string) || '');
      this._subs = ctrl.valueChanges?.subscribe((v: any) => this.selectedColor.set(v || '')) ?? null;
    }
  }

  ngOnDestroy(): void {
    if (this._subs) this._subs.unsubscribe();
  }

  /**
   * Formate le label pour l'affichage (avec traduction)
   */
  formatLabel(label: string | null): string {
    if (!label) return '—';

    const formatted = label
      .replace(/^card_/, '')
      .replace(/^value_/, '')
      .replace(/^each_/, '')
      .replace(/^condition_/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .join(' ');
    
    // Traduire la valeur formatée
    return this.translationService.translateFormatted(formatted, 'temple');
  }

  /**
   * Formate le label pour les noms d'images (sans traduction)
   */
  formatLabelImage(label: string | null): string {
    if (!label) return '';
    
    // Formater sans traduire - garder le nom original pour les images
    return label
      .replace(/^card_/, '')
      .replace(/^value_/, '')
      .replace(/^each_/, '')
      .replace(/^condition_/, '')
      .replace(/_/g, '_'); // Garder les underscores pour les noms de fichiers
  }

  toggleEdit() {
    this.isEditing.update(v => !v);
  }

  /**
   * Émet un signal au parent pour supprimer ce temple.
   */
  onDelete() {
    if (this.templeIndex !== undefined) {
      this.deleteTemple.emit(this.templeIndex);
    }
  }
}
