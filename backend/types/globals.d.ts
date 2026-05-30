declare global {
  function parseInt(string: string, radix?: number): number;
  interface NumberConstructor {
    (value?: any): number;
  }
  const Number: NumberConstructor;
  const Math: {
    min(...values: number[]): number;
    max(...values: number[]): number;
    ceil(x: number): number;
    floor(x: number): number;
  };
  
  interface Number {
    toString(): string;
  }
}

export {};
