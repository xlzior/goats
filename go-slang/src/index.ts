import { GolangParser } from "./parser"
import { GolangCompiler } from "./compiler"
import { GolangVM } from "./vm"

// Facade class that contains parser, compiler and vm / main entry point
export class GolangRunner {

  private parser: GolangParser
  private compiler: GolangCompiler
  private vm: GolangVM

  constructor() {
    this.parser = new GolangParser()
    this.compiler = new GolangCompiler()
    this.vm = new GolangVM()
  }

  async execute(program: string) {
    const ast = await this.parser.parse(program)
    const instr_set = this.compiler.compile_program(ast)
    const result = this.vm.run(instr_set)
    return result
  }
}
