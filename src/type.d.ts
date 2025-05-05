import { Request } from 'express'
import Users from './models/schemas/User.schema'
import { TokenPayload } from './models/requests/User.requests'
import Tweet from './models/schemas/Twitter.schema'

declare module 'express' {
  interface Request {
    user?: Users
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
    tweet?: Tweet
  }
}
