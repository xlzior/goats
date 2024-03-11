import { Op } from "./ast";

export type LDC = {
  tag: "LDC";
  val: boolean | string | number | undefined;
};

export type BINOP = {
  tag: "BINOP";
  sym: Op;
};

export type UNOP = {
  tag: "UNOP";
  sym: Op;
};

export type GOTO = {
  tag: "GOTO";
  addr: number;
};

export type JOF = {
  tag: "JOF";
  addr: number;
};

export type RESET = {
  tag: "RESET";
};

export type ASSIGN = {
  tag: "ASSIGN";
  sym: string;
};

export type CALL = {
  tag: "CALL";
  arity: number;
};

export type ENTER_SCOPE = {
  tag: "ENTER_SCOPE";
  syms: string[];
};

export type POP = {
  tag: "POP";
};

export type EXIT_SCOPE = {
  tag: "EXIT_SCOPE";
};

export type LD = {
  tag: "LD";
  sym: string;
};

export type LDF = {
  tag: "LDF";
  params: string[];
  addr: number;
};

export type DONE = {
  tag: "DONE";
};

export type Instruction =
  | LDC
  | LD
  | BINOP
  | UNOP
  | GOTO
  | JOF
  | RESET
  | ASSIGN
  | LDF
  | CALL
  | ENTER_SCOPE
  | EXIT_SCOPE
  | POP
  | DONE;
