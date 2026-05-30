// Global type declarations for corrupted TypeScript installation

declare global {
  interface PromiseLike<T> {
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2>;
  }

  class Promise<T> {
    constructor(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void);
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2>;
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
    ): Promise<T | TResult>;
    finally(onfinally?: (() => void) | null): Promise<T>;
    static all<T>(promises: PromiseLike<T>[]): Promise<T[]>;
    static race<T>(promises: PromiseLike<T>[]): Promise<T>;
    static resolve<T>(value: T | PromiseLike<T>): Promise<T>;
    static reject<T = never>(reason?: any): Promise<T>;
  }

  interface String {
    substring(start: number, end?: number): string;
  }

  class Array<T> {
    constructor(...items: T[]);
    length: number;
    push(...items: T[]): number;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...items: T[]): number;
    slice(start?: number, end?: number): T[];
    splice(start: number, deleteCount?: number): T[];
    splice(start: number, deleteCount: number, ...items: T[]): T[];
    indexOf(searchElement: T, fromIndex?: number): number;
    lastIndexOf(searchElement: T, fromIndex?: number): number;
    includes(searchElement: T, fromIndex?: number): boolean;
    forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
    map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
    filter<S extends T>(callbackfn: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S[];
    filter(callbackfn: (value: T, index: number, array: T[]) => unknown, thisArg?: any): T[];
    reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T): T;
    reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue: T): T;
    reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
    static isArray(arg: any): arg is any[];
  }

  class Date {
    constructor();
    constructor(value: string | number);
    static now(): number;
    getTime(): number;
    toISOString(): string;
  }
}

export {};
