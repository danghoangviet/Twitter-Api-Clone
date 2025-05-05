import { ObjectId } from 'mongodb'

interface LikeType {
  _id?: ObjectId
  tweet_id: ObjectId
  user_id: ObjectId
  create_at?: Date
}

export default class LikeSchema {
  _id: ObjectId
  tweet_id: ObjectId
  user_id: ObjectId
  create_at: Date
  constructor({ _id, tweet_id, user_id, create_at }: LikeType) {
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.tweet_id = tweet_id
    this.create_at = create_at || new Date()
  }
}
