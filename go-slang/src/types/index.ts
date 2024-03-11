export type RunnerResult = RunnerResultSuccess | RunnerResultError;

type RunnerResultSuccess = {
  value: any;
};

type RunnerResultError = {
  value?: any;
  error: string;
};
