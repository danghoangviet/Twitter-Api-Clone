import { ObjectId } from 'mongodb'

interface BookmarkType {
  _id?: ObjectId
  tweet_id: ObjectId
  user_id: ObjectId
  create_at?: Date
}

export default class Bookmark {
  _id: ObjectId
  tweet_id: ObjectId
  user_id: ObjectId
  create_at: Date
  constructor({ _id, tweet_id, user_id, create_at }: BookmarkType) {
    this._id = _id || new ObjectId()
    this.user_id = user_id
    this.tweet_id = tweet_id
    this.create_at = create_at || new Date()
  }
}
