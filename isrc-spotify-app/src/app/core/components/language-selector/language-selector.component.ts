import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService, SupportedLanguage } from '../../services/i18n.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
})
export class LanguageSelectorComponent {
  isOpen = signal<boolean>(false);

  supportedLanguages: SupportedLanguage[] = [];

  constructor(public i18nService: I18nService) {
    this.supportedLanguages = this.i18nService.getSupportedLanguages();
  }

  toggleDropdown(): void {
    this.isOpen.update((current) => !current);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  selectLanguage(language: SupportedLanguage): void {
    this.i18nService.changeLanguage(language).subscribe({
      next: () => {
        this.closeDropdown();
      },
      error: (error) => {
        this.closeDropdown();
      },
    });
  }

  getCurrentLanguageInfo() {
    return this.i18nService.getLanguageInfo(this.i18nService.currentLanguage());
  }

  getLanguageInfo(language: SupportedLanguage) {
    return this.i18nService.getLanguageInfo(language);
  }

  isCurrentLanguage(language: SupportedLanguage): boolean {
    return this.i18nService.currentLanguage() === language;
  }

  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const component = target.closest('.language-selector');

    if (!component && this.isOpen()) {
      this.closeDropdown();
    }
  }
}
