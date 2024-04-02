export enum Types {
  UNDEFINED = "Undefined",
  LITERAL = "Literal",
  FUNCTION = "Function",
  RETURN = "Return",
  TUPLE = "Tuple",
}

export type Type =
  | UndefinedType
  | LiteralType
  | FunctionType
  | TupleType
  | ReturnType;

export type UndefinedType = {
  _type: Types.UNDEFINED;
};

export type LiteralType = {
  _type: Types.LITERAL;
  val: string; // the base type, such as int, string, bool
};

export type FunctionType = {
  _type: Types.FUNCTION;
  args: Type[];
  res: Type;
};

// used when returning multiple values
export type TupleType = {
  _type: Types.TUPLE;
  res: Type[];
};

export type ReturnType = {
  _type: Types.RETURN;
  res: Type;
};
