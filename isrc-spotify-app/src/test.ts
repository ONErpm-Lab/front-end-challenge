// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/dist/zone-testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    <T>(id: string): T;
    keys(): string[];
  };
};

// Primeiro, inicializar o ambiente de testes do Angular
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

// Encontrar todos os testes
const context = require.context('./', true, /\.spec\.ts$/);
// Carregar os módulos
context.keys().forEach(context);

// Função helper para criar mocks de HTTP
export function createMockHttpResponse(data: any, status: number = 200) {
  return {
    body: data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    ok: status >= 200 && status < 300,
  };
}

// Função helper para criar mocks de erro HTTP
export function createMockHttpError(status: number, message: string) {
  return {
    status,
    message,
    error: { message },
  };
}
