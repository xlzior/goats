export enum Types {
  UNDEFINED = "Undefined",
  LITERAL = "Literal",
  FUNCTION = "Function",
  RETURN = "Return",
  UNION = "Union",
}

export type Type =
  | UndefinedType
  | LiteralType
  | FunctionType
  | ReturnType
  | UnionType;

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
  res: Type[];
};

export type ReturnType = {
  _type: Types.RETURN;
  res: Type[];
};

// we don't support UnionTypes, so this is usually a TypeError
export type UnionType = {
  _type: Types.UNION;
  types: Type[];
};
