import { GolangParser } from "./parser";
import { GolangCompiler } from "./compiler";
import { GolangVM } from "./vm";
import { BuiltinFunction, RunnerResult } from "./types";

// Facade class that contains parser, compiler and vm / main entry point
export class GolangRunner {
  private parser: GolangParser;
  private compiler: GolangCompiler;
  private vm: GolangVM;

  constructor(builtin_mapping: Record<string, BuiltinFunction> = {}) {
    this.parser = new GolangParser();
    this.compiler = new GolangCompiler(builtin_mapping);
    this.vm = new GolangVM(builtin_mapping);
  }

  async execute(program: string): Promise<RunnerResult> {
    try {
      const { ast } = await this.parser.parse(program);
      const instr_set = this.compiler.compile_program(ast);
      const result = this.vm.run(instr_set);

      return { value: result };
    } catch (error: any) {
      return { error: error.toString() };
    }
  }
}
