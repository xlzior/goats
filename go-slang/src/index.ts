import { GolangCompiler } from "./compiler";
import { GolangParser } from "./parser";
import { GolangTypechecker } from "./typechecker";
import { BuiltinFunction, RunnerResult } from "./types";
import { GolangVM } from "./vm";

// Facade class that contains parser, compiler and vm / main entry point
export class GolangRunner {
  private parser: GolangParser;
  private typechecker: GolangTypechecker;
  private compiler: GolangCompiler;
  private vm: GolangVM;

  constructor(external_builtins: Record<string, BuiltinFunction> = {}) {
    this.parser = new GolangParser();
    this.typechecker = new GolangTypechecker(external_builtins);
    this.compiler = new GolangCompiler(external_builtins);
    this.vm = new GolangVM(external_builtins);
  }

  async execute(program: string): Promise<RunnerResult> {
    const { ast } = await this.parser.parse(program);
    this.typechecker.check_type(ast); // throws error if typechecking fails and terminate
    const instr_set = this.compiler.compile_program(ast);
    const result = this.vm.run(instr_set);
    return { value: result };
  }
}
