import { SyntaxError } from "../errors";
import { ParserResult, ParserResultSuccess } from "../types/ast";

const API_ENDPOINT = "http://localhost:8080/parse";

export class GolangParser {
  async parse(programString: string): Promise<ParserResultSuccess> {
    const requestBody = {
      program: programString,
    };

    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    };

    try {
      const response = await fetch(API_ENDPOINT, fetchOptions);
      const result: ParserResult = await response.json();
      if ("error" in result) throw new SyntaxError(result.error);
      return result;
    } catch (e: any) {
      throw e;
    }
  }
}
