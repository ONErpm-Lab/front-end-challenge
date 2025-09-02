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

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

const context = require.context('./', true, /\.spec\.ts$/);

context.keys().forEach(context);

export function createMockHttpResponse(data: any, status: number = 200) {
  return {
    body: data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    ok: status >= 200 && status < 300,
  };
}

export function createMockHttpError(status: number, message: string) {
  return {
    status,
    message,
    error: { message },
  };
}
