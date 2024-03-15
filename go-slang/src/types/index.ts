export type RunnerResult = {
  value?: any;
  error?: string;
};

export type BuiltinFunction = {
  arity: number;
  apply: any;
};
