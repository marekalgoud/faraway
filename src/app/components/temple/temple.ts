import { Component, inject, signal, computed, output, input, ChangeDetectionStrategy, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NOUVEAUX Imports pour Reactive Forms
import { ReactiveFormsModule, FormGroup, FormArray, FormControl } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TEMPLE_COLOR_CLASSES, TEMPLE_VALUE_CLASSES, TEMPLE_MULTIPLIER_CLASSES, TEMPLE_OPTION_CLASSES, type TempleOption } from '../../constants';
import { FormatterService } from '../../services/formatter.service';



@Component({
  selector: 'app-temple',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './temple.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Temple {
  private formatterService = inject(FormatterService);
  private destroyRef = inject(DestroyRef);
  
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
  // reactive color signal
  private selectedColor = signal<string>('');

  templeBgClass = computed(() => {
    const color = this.selectedColor();
    if (!color) return 'bg-gray-200';
    // Extraire le nom de couleur depuis 'card_blue' -> 'blue'
    const colorName = color.replace('card_', '').toLowerCase();
    return this.colorBgMap[colorName] || 'bg-gray-200';
  });

  constructor() {
    // Synchroniser selectedColor avec le FormControl
    effect(() => {
      const form = this.templeForm();
      if (!form) return;
      const ctrl = form.get('color') as FormControl | null;
      if (ctrl) {
        this.selectedColor.set(ctrl.value || '');
        // S'abonner aux changements avec nettoyage automatique
        ctrl.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(value => {
            this.selectedColor.set(value || '');
          });
      }
    });
  }

  // Listes des options pour les <select> du template
  colorOptions = TEMPLE_COLOR_CLASSES;
  valueOptions = TEMPLE_VALUE_CLASSES.toSorted();
  multiplierOptions = TEMPLE_MULTIPLIER_CLASSES.toSorted();
  optionsList: readonly TempleOption[] = TEMPLE_OPTION_CLASSES;

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

  /**
   * Formate le label pour l'affichage (avec traduction)
   */
  formatLabel(label: string | null): string {
    return this.formatterService.formatLabel(label, 'temple');
  }

  /**
   * Formate le label pour les noms d'images (sans traduction)
   */
  formatLabelImage(label: string | null): string {
    return this.formatterService.formatLabelImage(label);
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

