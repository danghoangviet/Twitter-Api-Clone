import { Collection, Db, MongoClient } from 'mongodb'
import Users from '~/models/schemas/User.schema'
import RefreshTokenSchema from '~/models/schemas/RefreshToken.schema'
import FollowSchema from '~/models/schemas/Follow.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Twitter.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'
import LikeSchema from '~/models/schemas/Like.schema'
import Conversation from '~/models/schemas/Conversation.schema'
import { envConfig } from '~/utils/config'
const username = envConfig.db.username
const password = envConfig.db.password
const dbName = envConfig.db.name
const userCollection = envConfig.db.collections.users
const uri = `mongodb+srv://${username}:${password}@twitter.04pghrk.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(dbName)
  }

  async connect() {
    try {
      await this.client.connect()
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.error('Error connecting to MongoDB:', error)
    }
  }

  async disconnect() {
    try {
      await this.client.close()
      console.log('Disconnected from MongoDB')
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error)
    }
  }

  async indexUsers() {
    const exitsValue = await this.users.indexExists(['email_1_password_1', 'username_1', 'email_1'])

    if (!exitsValue) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshTokens() {
    const exitsValue = await this.refreshTokens.indexExists(['token_1', 'exp_1'])

    if (!exitsValue) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 }) // auto remove when exp expired, time to live of MongoDB,
      // Note: set expireAfterSeconds = 0 -> auto remove when exp expired
      // else if set expireAfterSeconds = value ex value = 10 then auto remove after 10 second
    }
  }

  async indexVideoStatus() {
    const exitsValue = await this.videoStatus.indexExists(['name_1'])

    if (!exitsValue) {
      this.videoStatus.createIndex({ name: 1 })
    }
  }

  async indexFollows() {
    const exitsValue = await this.follows.indexExists(['user_id_1_followed_user_id_1'])
    if (!exitsValue) {
      this.follows.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }

  async indexTweets() {
    const exitsValue = await this.tweets.indexExists(['content_text'])
    if (!exitsValue) {
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }

  get users(): Collection<Users> {
    return this.db.collection(userCollection)
  }

  get refreshTokens(): Collection<RefreshTokenSchema> {
    return this.db.collection(envConfig.db.collections.refreshTokens)
  }

  get follows(): Collection<FollowSchema> {
    return this.db.collection(envConfig.db.collections.follows)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(envConfig.db.collections.videoStatus)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(envConfig.db.collections.tweets)
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(envConfig.db.collections.hashtags)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(envConfig.db.collections.bookmarks)
  }

  get likes(): Collection<LikeSchema> {
    return this.db.collection(envConfig.db.collections.likes)
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection(envConfig.db.collections.conversations)
  }
}
const databaseService = new DatabaseService()
export default databaseService
