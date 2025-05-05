import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGES, LIKE_MESSAGES } from '~/constants/messages'
import { BookmarkRequestBody, BookmarkRequestParams } from '~/models/requests/Bookmark.request'
import { TokenPayload } from '~/models/requests/User.requests'
import likeService from '~/services/like.services'

export const LikeTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await likeService.like(user_id, req.body.tweet_id)
  return res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESS,
    result
  })
}

export const UnLikeTweetController = async (req: Request<BookmarkRequestParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  const result = await likeService.unlike(user_id, tweet_id)
  return res.json({
    message: LIKE_MESSAGES.UNLIKE_SUCCESS,
    result
  })
}
