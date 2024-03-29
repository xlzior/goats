export type RunnerResult = {
  value: any;
};

export type BuiltinFunction = {
  arity: number;
  apply: any;
};

export enum DataType {
  INT = "int",
  STRING = "string",
  BOOL = "bool",
  MUTEX = "Mutex",
  WAITGROUP = "WaitGroup",
}
