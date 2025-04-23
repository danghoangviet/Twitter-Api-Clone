import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import Users from '~/models/schemas/User.schema'
import RefreshTokenSchema from '~/models/schemas/RefreshToken.schema'
import FollowSchema from '~/models/schemas/Follow.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Twitter.schema'
dotenv.config()
const username = process.env.DB_USERNAME
const password = process.env.DB_PASSWORD
const dbName = process.env.DB_NAME
const userCollection = process.env.USERS_COLLECTION
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

  get users(): Collection<Users> {
    return this.db.collection(userCollection as string)
  }

  get refreshTokens(): Collection<RefreshTokenSchema> {
    return this.db.collection(process.env.REFRESH_TOKEN_COLLECTION as string)
  }

  get follows(): Collection<FollowSchema> {
    return this.db.collection(process.env.FOLLOW_COLLECTION as string)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(process.env.VIDEO_STATUS_COLLECTION as string)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.TWEETS_COLLECTION as string)
  }
}
const databaseService = new DatabaseService()
export default databaseService
