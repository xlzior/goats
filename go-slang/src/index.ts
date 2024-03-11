import { GolangParser } from "./parser";
import { GolangCompiler } from "./compiler";
import { GolangVM } from "./vm";
import { ParserResult, RunnerResult } from "./types";

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
      const parserResult: ParserResult = await this.parser.parse(program);

      if (parserResult.error) {
        return {
          error: parserResult.error,
        };
      }

      let instr_set;
      // To disable typescript warnings that parserResult.ast would possibly be undefined
      // although it would never be the case when it reaches here
      if (parserResult.ast) {
        instr_set = this.compiler.compile_program(parserResult.ast);
      }

      const result = this.vm.run(instr_set);
      return {
        value: result,
      };
    } catch (error: any) {
      return { error };
    }
  }
}
