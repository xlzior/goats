const API_ENDPOINT = 'http://localhost:8080/parse'

export class GolangParser {

  async parse(programString: string) {

    const requestBody = {
      program: programString
    }

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }

    try {
      const response = await fetch(API_ENDPOINT, fetchOptions)
      const data = await response.json()
      // console.log(JSON.stringify(data, null, 2))
      // return data.ast

      const binaryExprAST = data.ast.Decls[1].Body.List[0].X
      return binaryExprAST
      
    } catch (e) {
      console.error(e)
      return null
    }
    
  }
}
