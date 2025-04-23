import { NextFunction, Request, RequestHandler, Response } from 'express'

type FunctionType<P> = (
  req: Request<P>,
  res: Response,
  next: NextFunction
) => Promise<void> | Promise<Response<any, Record<string, any>>> | void

export const wrapRequestHandler = <P>(fn: FunctionType<P>): RequestHandler<P> => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    // Promise.resolve(fn(req, res, next)).catch(next)

    // use try-catch can catch sync func and normal function
    try {
      await fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
