import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetType } from '~/constants/enum'
import { TWEETS_MESSAGES } from '~/constants/messages'
import { Pagination, TweetParam, TweetQuery, TweetsRequestBody } from '~/models/requests/Tweet.request'
import { TokenPayload } from '~/models/requests/User.requests'
import tweetService from '~/services/tweets.services'

export const CreateTweetController = async (
  req: Request<ParamsDictionary, any, TweetsRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet(req.body, user_id)
  return res.json({
    message: TWEETS_MESSAGES.CREATE_SUCCESS,
    result
  })
}

export const GetTweetController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await tweetService.increaseView(req.params?.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    update_at: result.update_at
  }
  return res.json({
    message: TWEETS_MESSAGES.GET_TWEET_SUCCESS,
    result: tweet
  })
}

export const GetTweetChildrenController = async (
  req: Request<TweetParam, any, any, TweetQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const tweet_type = Number(req.query.tweet_type) as TweetType
  const user_id = req.decoded_authorization?.user_id
  const { tweet, total } = await tweetService.getTweetChildren({
    tweet_id: req.params.tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  })
  return res.json({
    message: TWEETS_MESSAGES.GET_TWEET_CHILDREN_SUCCESS,
    result: {
      tweet,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}

export const GetNewFeedsController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const result = await tweetService.getNewFeeds({
    user_id,
    limit,
    page
  })
  return res.json({
    message: TWEETS_MESSAGES.GET_NEW_FEEDS_SUCCESS,
    tweets: result.tweets,
    limit,
    page,
    total_page: Math.ceil(result.total / limit)
  })
}
