import { Component, inject, signal, computed, OnInit, OnDestroy, output, input } from '@angular/core';
import { Subscription } from 'rxjs';

// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormControl } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { TEMPLE_COLOR_CLASSES, TEMPLE_VALUE_CLASSES, TEMPLE_MULTIPLIER_CLASSES } from '../../constants';



@Component({
  selector: 'app-temple',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe], // Ajout de CommonModule + ReactiveFormsModule
  templateUrl: './temple.html',
  styles: []
})
export class Temple implements OnInit, OnDestroy {
  protected translationService = inject(TranslationService);
  
  // Le FormGroup est maintenant passé en input signal
  templeForm = input.required<FormGroup>();
  templeUrl = input.required<string>();
  templeIndex = input<number>();

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
  colorOptions = TEMPLE_COLOR_CLASSES;
  valueOptions = TEMPLE_VALUE_CLASSES.toSorted();
  multiplierOptions = TEMPLE_MULTIPLIER_CLASSES.toSorted();
  optionsList = ['chimera', 'gem', 'hint', 'night', 'thistle'];

  // Helpers pour accéder facilement aux parties du formulaire dans le template
  get optionsArray(): FormArray<FormControl<string|null>> {
    return this.templeForm().get('options') as FormArray<FormControl<string|null>>;
  }

  addOption() {
    this.optionsArray.push(new FormControl(null, { nonNullable: true }));
  }

  removeOption(index: number) {
    this.optionsArray.removeAt(index);
  }

  ngOnInit(): void {
    const form = this.templeForm();
    if (!form) return;
    const ctrl = form.get('color') as FormControl | null;
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
    const index = this.templeIndex();
    if (index !== undefined) {
      this.deleteTemple.emit(index);
    }
  }
}

