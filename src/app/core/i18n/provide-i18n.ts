import {
  EnvironmentProviders,
  inject,
  isDevMode,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { I18n } from './i18n';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './i18n.constants';
import { TranslationLoader } from './translations/translation-loader';

/** Transloco wired to the lazy translation chunks. Reused by tests, which init the language themselves. */
export function provideTranslation(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs: [...SUPPORTED_LANGUAGES],
        defaultLang: DEFAULT_LANGUAGE,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslationLoader,
    }),
  ]);
}

/** Translations plus the startup step that loads the visitor's language before the first render. */
export function provideI18n(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideTranslation(),
    provideAppInitializer(() => inject(I18n).init()),
  ]);
}
