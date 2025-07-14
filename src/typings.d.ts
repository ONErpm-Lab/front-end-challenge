/// <reference types="jasmine" />

declare namespace jasmine {
  interface Matchers<T> {
    toBeTruthy(): boolean;
    toBeFalsy(): boolean;
    toBe(expected: any): boolean;
    toEqual(expected: any): boolean;
    toHaveBeenCalled(): boolean;
    toHaveBeenCalledWith(...args: any[]): boolean;
  }
}