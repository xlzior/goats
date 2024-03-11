function peek(stack: Array<any>) {
  if (stack.length === 0) throw new Error("Stack is empty!");
  return stack[stack.length - 1];
}

const binop_microcode: any = {
  "+": (x: any, y: any) => x + y,
  "*": (x: number, y: number) => x * y,
  "-": (x: number, y: number) => x - y,
  "/": (x: number, y: number) => x / y,
  "%": (x: number, y: number) => x % y,
  "<": (x: number, y: number) => x < y,
  "<=": (x: number, y: number) => x <= y,
  ">=": (x: number, y: number) => x >= y,
  ">": (x: number, y: number) => x > y,
  "===": (x: number, y: number) => x === y,
  "!==": (x: number, y: number) => x !== y,
};

const apply_binop = (op: string, v2: number, v1: number) =>
  binop_microcode[op](v1, v2);

// TODO: move this to somewhere else
// should be be dependency injected
const builtin_mapping: Record<string, any> = {
  Println: (v: any) => console.log("Go program printed:", v),
};

const apply_builtin = (builtin_symbol: string, args: any[]) =>
  builtin_mapping[builtin_symbol](...args);

const global_frame: Record<string, any> = {};

for (const key in builtin_mapping) {
  global_frame[key] = {
    tag: "BUILTIN",
    sym: key,
    arity: 1, // TODO: find the arity of the function
  };
}

const empty_environment: any[] = [];
const global_environment = [global_frame, empty_environment];

const lookup = (x: string, e: any[]): any => {
  if (e.length < 2) return console.error("unbound name: ", x);

  if (e[0].hasOwnProperty(x)) {
    const v = e[0][x];
    if (is_unassigned(v)) return console.error(x, "unassigned name");
    return v;
  }

  return lookup(x, e[1]);
};

const assign_value = (x: string, v: any, e: any[]) => {
  if (e.length < 2) return console.error("unbound name: ", x);

  if (e[0].hasOwnProperty(x)) {
    e[0][x] = v;
  } else {
    assign_value(x, v, e[1]);
  }
};

const extend = (xs: string[], vs: any[], e: any) => {
  if (vs.length > xs.length) console.error("too many arguments");
  if (vs.length < xs.length) console.error("too few arguments");

  const new_frame = Object.fromEntries(
    xs.map((key, index) => [key, vs[index]])
  );
  return [new_frame, e];
};

const unassigned = { tag: "unassigned" };

const is_unassigned = (v: any) => v.tag === "unassigned";

export class GolangVM {
  private OS: Array<any>;
  private PC: number;
  private E: Array<any>;
  private RTS: Array<any>;
  private microcode: any;

  constructor() {
    this.OS = [];
    this.PC = 0;
    this.E = global_environment;
    this.RTS = [];
    this.microcode = {
      LDC: (instr: any) => {
        this.PC++;
        this.OS.push(instr.val);
      },
      BINOP: (instr: any) => {
        this.PC++;
        this.OS.push(apply_binop(instr.sym, this.OS.pop(), this.OS.pop()));
      },
      POP: (instr: any) => {
        this.PC++;
        this.OS.pop();
      },
      JOF: (instr: any) => {
        this.PC = this.OS.pop() ? this.PC + 1 : instr.addr;
      },
      GOTO: (instr: any) => {
        this.PC = instr.addr;
      },
      ENTER_SCOPE: (instr: any) => {
        this.PC++;
        this.RTS.push({ tag: "BLOCK_FRAME", env: this.E });
        const locals = instr.syms;
        const unassigneds = locals.map(() => unassigned);
        this.E = extend(locals, unassigneds, this.E);
      },
      EXIT_SCOPE: (instr: any) => {
        this.PC++;
        this.E = this.RTS.pop().env;
      },
      LD: (instr: any) => {
        this.PC++;
        this.OS.push(lookup(instr.sym, this.E));
      },
      ASSIGN: (instr: any) => {
        this.PC++;
        assign_value(instr.sym, peek(this.OS), this.E);
      },
      LDF: (instr: any) => {
        this.PC++;
        this.OS.push({
          tag: "CLOSURE",
          params: instr.params,
          addr: instr.addr,
          env: this.E,
        });
      },
      CALL: (instr: any) => {
        const arity = instr.arity;
        let args = [];
        for (let i = arity - 1; i >= 0; i--) args.push(this.OS.pop());
        const sf = this.OS.pop();
        if (sf.tag === "BUILTIN") {
          this.PC++;
          this.OS.push(apply_builtin(sf.sym, args));
          return;
        }
        this.RTS.push({ tag: "CALL_FRAME", addr: this.PC + 1, env: this.E });
        this.E = extend(sf.params, args, sf.env);
        this.PC = sf.addr;
      },
      RESET: (instr: any) => {
        const top_frame = this.RTS.pop();
        if (top_frame.tag === "CALL_FRAME") {
          this.PC = top_frame.addr;
          this.E = top_frame.env;
        }
      },
    };
  }

  run(instrs: any) {
    while (!(instrs[this.PC].tag === "DONE")) {
      const instr = instrs[this.PC];
      if (this.microcode[instr.tag]) {
        this.microcode[instr.tag](instr);
      } else {
        throw Error(`${instr.tag} not implemented`);
      }
    }
    return peek(this.OS);
  }
}
