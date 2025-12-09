import { Component, signal, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TranslationService, Language } from '../../services/translation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  private translationService = inject(TranslationService);
  
  protected readonly version = signal(environment.version);
  protected readonly currentYear = signal(new Date().getFullYear());
  protected readonly currentLanguage = this.translationService.language;
  protected readonly showLanguageMenu = signal(false);

  toggleLanguageMenu() {
    this.showLanguageMenu.update(v => !v);
  }

  changeLanguage(lang: Language) {
    this.translationService.setLanguage(lang);
    this.showLanguageMenu.set(false);
  }

  getLanguageFlag(lang: Language): string {
    return lang === 'fr' ? '🇫🇷' : '🇬🇧';
  }

  getLanguageName(lang: Language): string {
    return lang === 'fr' ? 'Français' : 'English';
  }
}
