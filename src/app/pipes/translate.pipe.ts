import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy, effect } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private effectRef = effect(() => {
    // Écouter les changements de langue
    this.translationService.language();
    this.cdr.markForCheck();
  });

  ngOnDestroy() {
    this.effectRef.destroy();
  }

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translationService.translate(key, params);
  }
}
