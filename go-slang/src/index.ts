import { GolangParser } from "./parser";
import { GolangCompiler } from "./compiler";
import { GolangVM } from "./vm";
import { RunnerResult } from "./types";

// Facade class that contains parser, compiler and vm / main entry point
export class GolangRunner {
  private parser: GolangParser;
  private compiler: GolangCompiler;
  private vm: GolangVM;

  constructor(builtin_mapping: Record<string, any> = {}) {
    this.parser = new GolangParser();
    this.compiler = new GolangCompiler();
    this.vm = new GolangVM(builtin_mapping);
  }

  async execute(program: string): Promise<RunnerResult> {
    try {
      const parserResult = await this.parser.parse(program);
      if ("error" in parserResult) return { error: parserResult.error };

      const instr_set = this.compiler.compile_program(parserResult.ast);
      const result = this.vm.run(instr_set);

      return { value: result };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
