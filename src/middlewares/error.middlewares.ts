import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import { HttpStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'

const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err instanceof ErrorWithStatus) {
      return res.status(err.status).json(omit(err, 'status'))
    }

    const finalErr: any = {}
    // set enumerable of err messages to true to show msg in response
    Object.getOwnPropertyNames(err).forEach((key) => {
      if (
        !Object.getOwnPropertyDescriptor(err, key)?.enumerable ||
        !Object.getOwnPropertyDescriptor(err, key)?.writable
      )
        return
      finalErr[key] = err[key]
      // Object.defineProperty(err, key, {
      //   enumerable: true
      // })
    })

    res.status(HttpStatus.InternalServerError).json({
      messages: finalErr.message,
      errorInfo: omit(finalErr, ['stack'])
    })
  } catch (error) {
    res.status(HttpStatus.InternalServerError).json({
      messages: 'Something went wrong',
      errorInfo: omit(error as any, ['stack'])
    })
  }
}

export default defaultErrorHandler
