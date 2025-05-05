import { faker } from '@faker-js/faker'
import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import { TweetsRequestBody } from '~/models/requests/Tweet.request'
import { RegisterRequestBody } from '~/models/requests/User.requests'
import FollowSchema from '~/models/schemas/Follow.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import tweetsService from '~/services/tweets.services'
import { hashPassword } from '~/utils/crypto'

// Mật khẩu cho các fake user
const PASSWORD = '123456aA@'
// ID của tài khoản của mình, dùng để follow người khác
const MYID = new ObjectId('680b184bf7c39205f6358709')
// Số lượng user được tạo, mỗi user sẽ mặc định tweet 2 cái
const USER_COUNT = 500

const createRandomUser = () => {
  const user: RegisterRequestBody = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirm_password: PASSWORD,
    date_of_birth: faker.date.past().toISOString()
  }
  return user
}

const createRandomTweet = () => {
  const tweet: TweetsRequestBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({
      min: 10,
      max: 160
    }),
    hashtags: [],
    medias: [],
    mentions: [],
    parent_id: null
  }
  return tweet
}

const users: RegisterRequestBody[] = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT
})

const insertMultipleUsers = async (users: RegisterRequestBody[]) => {
  console.log('Creating users...')
  const result = await Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId()
      await databaseService.users.insertOne(
        new User({
          ...user,
          username: `user$${user_id.toString()}`,
          password: hashPassword(user.password),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified
        })
      )
      return user_id
    })
  )
  console.log(`Created $${result.length} users`)
  return result
}

const followMultipleUsers = async (user_id: ObjectId, followed_user_ids: ObjectId[]) => {
  console.log('Start following...')
  const result = await Promise.all(
    followed_user_ids.map((followed_user_id) =>
      databaseService.follows.insertOne(
        new FollowSchema({
          user_id,
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
    )
  )
  console.log(`Followed ${result.length} users`)
}

const insertMultipleTweets = async (ids: ObjectId[]) => {
  console.log('Creating tweets...')
  console.log('Counting...')
  let count = 0
  const result = await Promise.all(
    ids.map(async (id, index) => {
      await Promise.all([
        tweetsService.createTweet(createRandomTweet(), id.toString()),
        tweetsService.createTweet(createRandomTweet(), id.toString())
      ])
      count += 2
      console.log(`Created $${count} tweets`)
    })
  )
  return result
}
insertMultipleUsers(users).then((ids) => {
  followMultipleUsers(new ObjectId(MYID), ids)
  insertMultipleTweets(ids)
})
