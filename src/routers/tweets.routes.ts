import { Router } from 'express'
import {
  CreateTweetController,
  GetNewFeedsController,
  GetTweetChildrenController,
  GetTweetController
} from '~/controllers/tweets.controllers'
import {
  audienceValidator,
  createTweetsValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator, isUserLoggedInValidator } from '~/middlewares/users.middlewares'
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
/**
 * Path: /:tweet_id
 * Method: GET
 * Description: Get Tweet Detail
 * header: {Authorization?: Bearer <access_token>}
 */
tweetsRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(GetTweetController)
)
/**
 * Path: /:tweet_id/children
 * Method: GET
 * Description: Get Tweet Children
 *  header: {Authorization?: Bearer <access_token>}
 * query: { limit: number, page: number, tweet_type: TweetType}
 */
tweetsRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  getTweetChildrenValidator,
  paginationValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(GetTweetChildrenController)
)
/**
 * Path: /new-feed
 * Method: GET
 * Description: Get new feeds
 *  header: {Authorization?: Bearer <access_token>}
 * query: { limit: number, page: number}
 */
tweetsRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(GetNewFeedsController)
)

export default tweetsRouter
