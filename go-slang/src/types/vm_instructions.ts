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

export type MAKE_WAITGROUP = {
  _type: "MAKE_WAITGROUP";
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

export type WG_ADD = {
  _type: "WG_ADD";
};

export type WG_DONE = {
  _type: "WG_DONE";
};

export type WG_WAIT = {
  _type: "WG_WAIT";
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
  | MAKE_WAITGROUP
  | SEND
  | RECV
  | LOCK
  | UNLOCK
  | WG_ADD
  | WG_DONE
  | WG_WAIT
  | DONE;
