import { Router } from 'express'
import { LikeTweetController, UnLikeTweetController } from '~/controllers/likes.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const likesRouter = Router()
/**
 * Path: /
 * Method: POST
 * Description: like
 * Body: {tweet_id: string}
 */
likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(LikeTweetController)
)
/**
 * Path: /:tweet_id
 * Method: DELETE
 * Description: un like
 */
likesRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(UnLikeTweetController)
)

export default likesRouter
