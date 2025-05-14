import argv from 'minimist'
import dotenv from 'dotenv'

dotenv.config()
const options = argv(process.argv.slice(2))
export const isProduction = Boolean(options.production)
export const isDevelopment = Boolean(options.development)

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

export const envConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || 'http://localhost:4000',

  db: {
    username: getEnv('DB_USERNAME'),
    password: getEnv('DB_PASSWORD'),
    name: getEnv('DB_NAME'),
    collections: {
      users: getEnv('USERS_COLLECTION'),
      refreshTokens: getEnv('REFRESH_TOKEN_COLLECTION'),
      follows: getEnv('FOLLOW_COLLECTION'),
      videoStatus: getEnv('VIDEO_STATUS_COLLECTION'),
      tweets: getEnv('TWEETS_COLLECTION'),
      hashtags: getEnv('HASHTAGS_COLLECTION'),
      bookmarks: getEnv('BOOKMARKS_COLLECTION'),
      likes: getEnv('LIKES_COLLECTION'),
      conversations: getEnv('CONVERSATION_COLLECTION')
    }
  },

  security: {
    passwordSalt: getEnv('PASSWORD_SALT'),
    jwt: {
      accessTokenSecret: getEnv('JWT_ACCESS_TOKEN_SECRETKEY'),
      refreshTokenSecret: getEnv('JWT_REFRESH_TOKEN_SECRETKEY'),
      emailVerifyTokenSecret: getEnv('JWT_EMAIL_VERIFY_TOKEN_SECRETKEY'),
      forgotPasswordTokenSecret: getEnv('JWT_FORGOT_PASSWORD_TOKEN_SECRETKEY'),
      accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1d',
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '100d',
      emailVerifyExpiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN || '1d',
      forgotPasswordExpiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN || '1d'
    }
  },

  googleOAuth: {
    clientId: getEnv('GOOGLE_CLIENT_ID'),
    clientSecret: getEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: getEnv('GOOGLE_REDIRECT_URI'),
    clientRedirectCallback: getEnv('CLIENT_REDIRECT_CALLBACK')
  },

  clientUrl: getEnv('CLIENT_URL'),

  aws: {
    accessKeyId: getEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnv('AWS_SECRET_ACCESS_KEY'),
    region: getEnv('AWS_REGION'),
    sesFromAddress: getEnv('SES_FROM_ADDRESS'),
    s3BucketName: getEnv('S3_BUCKET_NAME')
  }
}
