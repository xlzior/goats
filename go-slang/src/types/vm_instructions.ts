import { Token } from "./ast";

export enum InstructionType {
  LDC = "LDC",
  BINOP = "BINOP",
  UNOP = "UNOP",
  GOTO = "GOTO",
  JOF = "JOF",
  RESET = "RESET",
  DEFINE = "DEFINE",
  ASSIGN = "ASSIGN",
  CALL = "CALL",
  ENTER_SCOPE = "ENTER_SCOPE",
  POP = "POP",
  EXIT_SCOPE = "EXIT_SCOPE",
  LD = "LD",
  LDF = "LDF",
  DONE = "DONE",
}

export type LDC = {
  tag: InstructionType.LDC;
  val: boolean | string | number | undefined;
};

export type BINOP = {
  tag: InstructionType.BINOP;
  sym: Token;
};

export type UNOP = {
  tag: InstructionType.UNOP;
  sym: Token;
};

export type GOTO = {
  tag: InstructionType.GOTO;
  addr: number;
};

export type JOF = {
  tag: InstructionType.JOF;
  addr: number;
};

export type RESET = {
  tag: InstructionType.RESET;
};

export type DEFINE = {
  tag: InstructionType.DEFINE;
  sym: string;
};

export type ASSIGN = {
  tag: InstructionType.ASSIGN;
  sym: string;
};

export type CALL = {
  tag: InstructionType.CALL;
  arity: number;
};

export type ENTER_SCOPE = {
  tag: InstructionType.ENTER_SCOPE;
};

export type POP = {
  tag: InstructionType.POP;
};

export type EXIT_SCOPE = {
  tag: InstructionType.EXIT_SCOPE;
};

export type LD = {
  tag: InstructionType.LD;
  sym: string;
};

export type LDF = {
  tag: InstructionType.LDF;
  params: string[];
  addr: number;
};

export type DONE = {
  tag: InstructionType.DONE;
};

export type Instruction =
  | LDC
  | LD
  | BINOP
  | UNOP
  | GOTO
  | JOF
  | RESET
  | DEFINE
  | ASSIGN
  | LDF
  | CALL
  | ENTER_SCOPE
  | EXIT_SCOPE
  | POP
  | DONE;
