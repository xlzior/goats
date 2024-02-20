// Translated from: https://github.com/antlr/grammars-v4/blob/master/golang/Python3/GoParserBase.py

import { Parser } from "antlr4ts";
import { GoLexer } from "./out/GoLexer";

export abstract class GoParserBase extends Parser {
  closingBracket(): boolean {
    const la = this._input.LA(1);
    return la === GoLexer.R_PAREN || la === GoLexer.R_CURLY;
  }
}
