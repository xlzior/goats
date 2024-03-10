import { ParserResult } from "../types";

const API_ENDPOINT = "http://localhost:8080/parse";

export class GolangParser {
  async parse(programString: string): Promise<ParserResult> {
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
      const data: ParserResult = await response.json();
      return data;
    } catch (e) {
      console.error(e);
      return { error: "An error occurred while parsing" };
    }
  }
}
