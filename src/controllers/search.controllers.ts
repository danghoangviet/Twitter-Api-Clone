import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { SearchQuery } from '~/models/requests/Search.request'
import searchService from '~/services/search.services'
import { TokenPayload } from '~/models/requests/User.requests'

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response,
  next: NextFunction
) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const content = req.query.content
  const media_type = req.query.media_type
  const people_follow = req.query.people_follow
  const result = await searchService.search({ limit, page, content, user_id, media_type, people_follow })
  return res.json({
    message: 'Search successfully',
    tweets: result.tweets,
    limit,
    page,
    total_page: Math.ceil(result.total / limit)
  })
}
