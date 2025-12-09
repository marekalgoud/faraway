import { Injectable, inject } from '@angular/core';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class FormatterService {
  private translationService = inject(TranslationService);

  /**
   * Formate le label pour l'affichage (avec traduction)
   */
  formatLabel(label: string | null, context: 'card' | 'temple'): string {
    if (!label) return '—';

    const formatted = label
      .replace(/^card_/, '')
      .replace(/^value_/, '')
      .replace(/^each_/, '')
      .replace(/^condition_/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .join(' ');
    
    return this.translationService.translateFormatted(formatted, context);
  }

  /**
   * Formate le label pour les noms d'images (sans traduction)
   */
  formatLabelImage(label: string | null): string {
    if (!label) return '';
    
    return label
      .replace(/^card_/, '')
      .replace(/^value_/, '')
      .replace(/^each_/, '')
      .replace(/^condition_/, '')
      .replace(/_/g, '_');
  }
}
