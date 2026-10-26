import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SUPPORTED_LANGUAGES } from '../i18n.constants';
import { TranslationLoader } from './translation-loader';

describe('TranslationLoader', () => {
  const loader = () => TestBed.inject(TranslationLoader);

  it.each(SUPPORTED_LANGUAGES)('loads the %s translations', async (language) => {
    const translation = await firstValueFrom(loader().getTranslation(language));

    expect(translation).toHaveProperty('status.retry');
    expect(translation).toHaveProperty('tracks.availableInBR');
  });

  it('loads different content for different languages', async () => {
    const english = await firstValueFrom(loader().getTranslation('en'));
    const portuguese = await firstValueFrom(loader().getTranslation('pt'));

    expect(portuguese).not.toEqual(english);
  });

  it.each([['de'], [''], ['../secret']])('refuses an unsupported language (%j)', (language) => {
    expect(() => loader().getTranslation(language)).toThrow(/unsupported language/i);
  });
});
