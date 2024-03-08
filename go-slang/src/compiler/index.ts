import {
  BasicLiteral,
  BinaryExpr,
}
  from "../types"

export class GolangCompiler {
  private wc: number
  private instrs: Array<any>
  private compile_comp: any

  constructor() {
    this.wc = 0
    this.instrs = []
    this.compile_comp = {
      BasicLit: (comp: BasicLiteral) => {
        this.instrs[this.wc++] = { tag: "LDC", val: Number(comp.Value) }
      },
      BinaryExpr: (comp: BinaryExpr) => {
        this.compile(comp.X)
        this.compile(comp.Y)
        this.instrs[this.wc++] = { tag: 'BINOP', sym: comp.Op }
      },
    }
  }

  compile_program(ast: any) {
    return this.compile(ast)
  }

  compile(comp: any) {
    this.compile_comp[comp._type](comp)
    this.instrs[this.wc] = { tag: 'DONE' }
    return this.instrs
  }
}
