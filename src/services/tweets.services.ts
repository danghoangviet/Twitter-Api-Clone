import { TweetsRequestBody } from '~/models/requests/Tweet.request'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Twitter.schema'
import { ObjectId } from 'mongodb'

class TweetService {
  async createTweet(body: TweetsRequestBody, user_id: string) {
    const { audience, content, hashtags, medias, mentions, parent_id, type } = body
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience,
        content,
        hashtags: [], // todo
        medias,
        mentions: [],
        parent_id,
        type,
        user_id: new ObjectId(user_id)
      })
    )
    return result
  }
}

const tweetService = new TweetService()
export default tweetService
