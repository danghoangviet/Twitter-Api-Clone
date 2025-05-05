import { Router } from 'express'
import { BookmarkTweetController, UnBookTweetController } from '~/controllers/bookmarks.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()
/**
 * Path: /
 * Method: POST
 * Description: bookmark tweet
 * Body: {tweet_id: string}
 */
bookmarksRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(BookmarkTweetController)
)
/**
 * Path: /:tweet_id
 * Method: DELETE
 * Description: un bookmark tweet
 */
bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(UnBookTweetController)
)

export default bookmarksRouter
