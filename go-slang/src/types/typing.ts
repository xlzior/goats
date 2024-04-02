export enum Types {
  UNDEFINED = "Undefined",
  LITERAL = "Literal",
  FUNCTION = "Function",
  RETURN = "Return",
}

export interface Type {
  _type: Types;
}

export interface UndefinedType extends Type {
  _type: Types.UNDEFINED;
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

export interface ReturnType extends Type {
  _type: Types.RETURN;
  res: Type[];
}
