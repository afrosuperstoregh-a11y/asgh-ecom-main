// Global type declarations for the frontend application

declare global {
  // Object
  interface Object {
    toString(): string;
    toLocaleString(): string;
    valueOf(): Object;
    hasOwnProperty(v: PropertyKey): boolean;
    isPrototypeOf(v: Object): boolean;
    propertyIsEnumerable(v: PropertyKey): boolean;
  }
  
  interface ObjectConstructor {
    new(value?: any): Object;
    (): any;
    (value: any): any;
    create(o: object | null): any;
    defineProperty(o: any, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>): any;
    defineProperties(o: any, properties: PropertyDescriptorMap & ThisType<any>): any;
    getOwnPropertyDescriptor(o: any, p: PropertyKey): PropertyDescriptor | undefined;
    getOwnPropertyNames(o: any): string[];
    getOwnPropertySymbols(o: any): symbol[];
    keys(o: object): string[];
    entries<T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][];
    entries(o: {}): [string, any][];
    values<T>(o: { [s: string]: T } | ArrayLike<T>): T[];
    values(o: {}): any[];
    getOwnPropertyDescriptors(o: any): PropertyDescriptorMap & ThisType<any>;
    freeze<T>(a: T): Readonly<T>;
    seal<T>(a: T): T;
    preventExtensions<T>(a: T): T;
    isFrozen(a: any): boolean;
    isSealed(a: any): boolean;
    isExtensible(a: any): boolean;
    assign<T, U>(target: T, source: U): T & U;
    assign<T, U, V>(target: T, source1: U, source2: V): T & U & V;
    assign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
    assign(target: any, ...sources: any[]): any;
    getPrototypeOf(o: any): any;
    setPrototypeOf(o: any, proto: object | null): any;
  }
  
  var Object: ObjectConstructor;

  // Error types
  interface Error {
    name: string;
    message: string;
    stack?: string;
  }
  
  interface ErrorConstructor {
    new(message?: string): Error;
    (message?: string): Error;
    readonly prototype: Error;
  }
  
  var Error: ErrorConstructor;

  // Date
  interface Date {
    toString(): string;
    toDateString(): string;
    toTimeString(): string;
    toISOString(): string;
    toJSON(): string;
  }
  
  interface DateConstructor {
    new(): Date;
    new(value: number | string): Date;
    new(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): Date;
    now(): number;
  }
  
  var Date: DateConstructor;

  // PromiseLike
  interface PromiseLike<T> {
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2>;
  }

  // Promise
  interface Promise<T> {
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2>;
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
    ): Promise<T | TResult>;
  }
  
  interface PromiseConstructor {
    new<T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;
    resolve<T>(value: T | PromiseLike<T>): Promise<T>;
    reject<T>(reason?: any): Promise<T>;
  }
  
  var Promise: PromiseConstructor;

  // Symbol
  interface Symbol {
    readonly description?: string;
    readonly [Symbol.toStringTag]: string;
    [Symbol.toPrimitive](hint: string): any;
    [Symbol.iterator](): Iterator<any>;
  }

  interface SymbolConstructor {
    (description?: string | undefined): Symbol;
    readonly iterator: symbol;
    readonly toStringTag: symbol;
    readonly toPrimitive: symbol;
  }

  var Symbol: SymbolConstructor;

  // Iterable
  interface Iterable<T> {
    [Symbol.iterator](): Iterator<T>;
  }

  interface IterableIterator<T> extends Iterator<T> {
    [Symbol.iterator](): IterableIterator<T>;
  }

  // Iterator
  interface Iterator<T> {
    next(value?: any): IteratorResult<T>;
    return?(value?: any): IteratorResult<T>;
    throw?(e?: any): IteratorResult<T>;
  }

  interface IteratorResult<T> {
    done: boolean;
    value: T;
  }

  // PropertyKey type
  type PropertyKey = string | number | symbol;

  // PropertyDescriptor
  interface PropertyDescriptor {
    configurable?: boolean;
    enumerable?: boolean;
    value?: any;
    writable?: boolean;
    get?(): any;
    set?(v: any): any;
  }

  // PropertyDescriptorMap
  interface PropertyDescriptorMap {
    [s: string]: PropertyDescriptor;
  }

  // ThisType utility
  interface ThisType<T> { }

  // React types
  type ReactNode = 
    | ReactElement
    | string
    | number
    | Iterable<ReactNode>
    | ReactPortal
    | boolean
    | null
    | undefined;

  interface ReactElement {
    type: any;
    props: any;
    key: any;
  }

  interface ReactPortal {
    key: null | string;
    children: ReactNode;
  }

  // ArrayLike
  interface ArrayLike<T> {
    readonly length: number;
    readonly [n: number]: T;
  }

  // Record utility type
  type Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // Array methods
  interface Array<T> extends Iterable<T> {
    push(...items: T[]): number;
    pop(): T | undefined;
    length: number;
    slice(start?: number, end?: number): T[];
    includes(searchElement: T, fromIndex?: number): boolean;
    map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
    filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): S[];
    filter(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): T[];
    forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
    [Symbol.iterator](): IterableIterator<T>;
  }

  // Navigator
  interface Navigator {
    onLine: boolean;
  }
  
  var navigator: Navigator;

  // Console
  interface Console {
    log(...data: any[]): void;
    error(...data: any[]): void;
    warn(...data: any[]): void;
    group(label?: string): void;
    groupEnd(): void;
  }
  
  var console: Console;

  // Window
  interface Window {
    location: Location;
  }
  
  var window: Window;

  interface Location {
    href: string;
  }

  // JSON
  interface JSON {
    parse(text: string, reviver?: (key: any, value: any) => any): any;
    stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
    stringify(value: any, replacer?: (number | string)[] | null, space?: string | number): string;
  }
  
  var JSON: JSON;

  // Intl
  interface NumberFormatOptions {
    style?: string;
    currency?: string;
    currencyDisplay?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  }

  interface Intl {
    NumberFormat: typeof NumberFormat;
  }

  interface NumberFormat {
    new(locales?: string | string[], options?: NumberFormatOptions): NumberFormat;
    format(number?: number): string;
  }

  var Intl: Intl;

  // String
  interface String {
    substring(start: number, end?: number): string;
    includes(searchString: string, position?: number): boolean;
    toLocaleDateString(locales?: string | string[], options?: any): string;
  }
}

export {};
