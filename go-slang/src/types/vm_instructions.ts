import { Token } from "./ast";

export type LDC = {
  _type: "LDC";
  val: boolean | string | number | undefined;
};

export type BINOP = {
  _type: "BINOP";
  sym: Token;
};

export type UNOP = {
  _type: "UNOP";
  sym: Token;
};

export type GOTO = {
  _type: "GOTO";
  addr: number;
};

export type JOF = {
  _type: "JOF";
  addr: number;
};

export type RESET = {
  _type: "RESET";
};

export type ASSIGN = {
  _type: "ASSIGN";
  sym: string;
  pos: [number, number];
};

export type CALL = {
  _type: "CALL";
  arity: number;
};

export type ENTER_SCOPE = {
  _type: "ENTER_SCOPE";
  num: number;
};

export type POP = {
  _type: "POP";
};

export type EXIT_SCOPE = {
  _type: "EXIT_SCOPE";
};

export type LD = {
  _type: "LD";
  sym: string;
  pos: [number, number];
};

export type LDF = {
  _type: "LDF";
  params: string[];
  addr: number;
};

export type THREAD_CALL = {
  _type: "THREAD_CALL";
  arity: number;
};

export type MAKE_MUTEX = {
  _type: "MAKE_MUTEX";
};

export type SEND = {
  _type: "SEND";
};

export type RECV = {
  _type: "RECV";
};

export type LOCK = {
  _type: "LOCK";
};

export type UNLOCK = {
  _type: "UNLOCK";
};

export type DONE = {
  _type: "DONE";
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
  | THREAD_CALL
  | ENTER_SCOPE
  | EXIT_SCOPE
  | POP
  | MAKE_MUTEX
  | SEND
  | RECV
  | LOCK
  | UNLOCK
  | DONE;
