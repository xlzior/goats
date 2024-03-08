function peek(stack: Array<any>) {
  if (stack.length === 0) throw new Error("Stack is empty!")
  return stack[stack.length - 1];
}

const binop_microcode: any = {
  '+': (x: any, y: any) => x + y,
  '*': (x: number, y: number) => x * y,
  '-': (x: number, y: number) => x - y,
  '/': (x: number, y: number) => x / y,
  '%': (x: number, y: number) => x % y,
  '<': (x: number, y: number) => x < y,
  '<=': (x: number, y: number) => x <= y,
  '>=': (x: number, y: number) => x >= y,
  '>': (x: number, y: number) => x > y,
  '===': (x: number, y: number) => x === y,
  '!==': (x: number, y: number) => x !== y
}

const apply_binop = (op: string, v2: number, v1: number) => binop_microcode[op](v1, v2)

export class GolangVM {
  private OS: Array<any>
  private PC: number
  private E: Array<any>
  private RTS: Array<any>
  private microcode: any

  constructor() {
    this.OS = []
    this.PC = 0
    this.E = []
    this.RTS = []
    this.microcode = {
      LDC:
        (instr: any)=> {
          this.PC++
          this.OS.push(instr.val)
        },
      BINOP:
        (instr: any) => {
          this.PC++
          this.OS.push(apply_binop(instr.sym, this.OS.pop(), this.OS.pop()))
        },
    }
  }

  run(instrs: any) {
    while (!(instrs[this.PC].tag === 'DONE')) {
      const instr = instrs[this.PC]
      this.microcode[instr.tag](instr)
    }
    return peek(this.OS)
  }
}
