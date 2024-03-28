import { GolangParser } from "./parser";
import { GolangCompiler } from "./compiler";
import { GolangVM } from "./vm";
import { BuiltinFunction, RunnerResult } from "./types";

// Facade class that contains parser, compiler and vm / main entry point
export class GolangRunner {
  private parser: GolangParser;
  private compiler: GolangCompiler;
  private vm: GolangVM;

  constructor(external_builtins: Record<string, BuiltinFunction> = {}) {
    this.parser = new GolangParser();
    this.compiler = new GolangCompiler(external_builtins);
    this.vm = new GolangVM(external_builtins);
  }

  async execute(program: string): Promise<RunnerResult> {
    const { ast } = await this.parser.parse(program);
    const instr_set = this.compiler.compile_program(ast);
    const result = this.vm.run(instr_set);
    return { value: result };
  }
}
