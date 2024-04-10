import { GolangCompiler } from "./compiler";
import { GolangParser } from "./parser";
import { GolangTypechecker } from "./typechecker";
import { BuiltinFunction, RunnerResult } from "./types";
import { GolangVM } from "./vm";
import { Config } from "./vm/config";

// Facade class that contains parser, compiler and vm / main entry point
export class GolangRunner {
  private external_builtins: Record<string, BuiltinFunction>;
  private config: Config;
  private parser: GolangParser;
  private typechecker: GolangTypechecker;
  private compiler: GolangCompiler;

  constructor(
    external_builtins: Record<string, BuiltinFunction> = {},
    config: Config = new Config(),
  ) {
    this.external_builtins = external_builtins;
    this.config = config;
    this.parser = new GolangParser();
    this.typechecker = new GolangTypechecker(external_builtins);
    this.compiler = new GolangCompiler(external_builtins);
  }

  async execute(program: string): Promise<RunnerResult> {
    const { ast } = await this.parser.parse(program);
    this.typechecker.check_type(ast); // throws error and terminate if typechecking fails
    const instr_set = this.compiler.compile_program(ast);
    const vm = new GolangVM(this.external_builtins, this.config);
    const result = vm.run(instr_set);
    return { value: result };
  }
}
