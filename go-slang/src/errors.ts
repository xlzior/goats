export class SyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyntaxError";
  }
}

export class TypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TypeError";
  }
}

export class CompilationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompilationError";
  }
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}
