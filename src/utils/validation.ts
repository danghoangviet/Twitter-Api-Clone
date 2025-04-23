import { NextFunction, Request, Response } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import { HttpStatus } from '~/constants/enum'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

// can be reused by many routes
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validations.run(req)
    const result = validationResult(req)
    if (result.isEmpty()) {
      return next()
    }

    const msgMapped = result.mapped()
    const entityErrors = new EntityError({ errors: {} })

    for (const key in msgMapped) {
      const { msg } = msgMapped[key]
      if (msg instanceof ErrorWithStatus && msg.status !== HttpStatus.UnprocessableEntity) {
        return next(msg)
      }
      entityErrors.errors[key] = msgMapped[key]
    }
    return next(entityErrors)
  }
}
