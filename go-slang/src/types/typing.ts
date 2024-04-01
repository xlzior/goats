export enum Types {
  LITERAL = "Literal",
  FUNCTION = "Function",
}

export interface Type {
  _type: Types;
}

export interface LiteralType extends Type {
  _type: Types.LITERAL;
  val: string; // the base type, such as int, string, bool
}

export interface FunctionType extends Type {
  _type: Types.FUNCTION;
  args: Type[];
  res: Type | Type[];
}
