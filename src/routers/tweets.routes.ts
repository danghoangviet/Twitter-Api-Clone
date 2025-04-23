import { Router } from 'express'
import { CreateTweetController } from '~/controllers/tweets.controllers'
import { createTweetsValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()
/**
 * Path: /
 * Method: POST
 * Description: Create Tweet
 * Body: TweetRequestBody
 */
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetsValidator,
  wrapRequestHandler(CreateTweetController)
)

export default tweetsRouter
