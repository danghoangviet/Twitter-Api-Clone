import { HttpStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'

type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
> // ex: { "name":  { msg: "name is required" } }

export class ErrorWithStatus {
  public message: string
  public status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType
  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HttpStatus.UnprocessableEntity })
    this.errors = errors
  }
}
