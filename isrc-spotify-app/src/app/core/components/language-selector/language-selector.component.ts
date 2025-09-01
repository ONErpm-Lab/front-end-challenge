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
  // Estado do dropdown
  isOpen = signal<boolean>(false);

  // Linguagens suportadas
  supportedLanguages: SupportedLanguage[] = [];

  constructor(public i18nService: I18nService) {
    this.supportedLanguages = this.i18nService.getSupportedLanguages();
  }

  /**
   * Alterna o estado do dropdown
   */
  toggleDropdown(): void {
    this.isOpen.update((current) => !current);
  }

  /**
   * Fecha o dropdown
   */
  closeDropdown(): void {
    this.isOpen.set(false);
  }

  /**
   * Seleciona um idioma
   */
  selectLanguage(language: SupportedLanguage): void {
    this.i18nService.changeLanguage(language).subscribe({
      next: () => {
        this.closeDropdown();
      },
      error: (error) => {
        console.error('Erro ao alterar idioma:', error);
        this.closeDropdown();
      },
    });
  }

  /**
   * Obtém informações do idioma atual
   */
  getCurrentLanguageInfo() {
    return this.i18nService.getLanguageInfo(this.i18nService.currentLanguage());
  }

  /**
   * Obtém informações de um idioma específico
   */
  getLanguageInfo(language: SupportedLanguage) {
    return this.i18nService.getLanguageInfo(language);
  }

  /**
   * Verifica se é o idioma atual
   */
  isCurrentLanguage(language: SupportedLanguage): boolean {
    return this.i18nService.currentLanguage() === language;
  }

  /**
   * Manipula clique fora do componente
   */
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const component = target.closest('.language-selector');

    if (!component && this.isOpen()) {
      this.closeDropdown();
    }
  }
}
