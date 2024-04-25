import { registerLocaleData } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

import portuguese from '@angular/common/locales/pt';

registerLocaleData(portuguese, 'pt-BR');

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
