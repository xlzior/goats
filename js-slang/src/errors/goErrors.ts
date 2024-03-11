import { SourceLocation } from 'estree'
import { ErrorSeverity, ErrorType, SourceError } from '../types'

export class GoError implements SourceError {
  type: ErrorType.RUNTIME
  severity: ErrorSeverity.ERROR
  location: SourceLocation
  description: string

  constructor(description: string) {
    this.description = description
  }

  explain(): string {
    return this.description
  }
  elaborate(): string {
    return this.description
  }
}
