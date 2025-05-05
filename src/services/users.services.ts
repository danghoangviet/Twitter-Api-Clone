import Users from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { ChangePasswordRequestBody, RegisterRequestBody, UpdateMeRequestBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { HttpStatus, TokenType, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshTokenSchema from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import { isEmpty } from 'lodash'
import { ErrorWithStatus } from '~/models/Errors'
import FollowSchema from '~/models/schemas/Follow.schema'
import axios from 'axios'
import { sendForgotPasswordEmail, sendVerifyEmailTemplate } from '~/utils/email'
dotenv.config()

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as any
      },
      privateKey: process.env.JWT_ACCESS_TOKEN_SECRETKEY as string
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.JWT_REFRESH_TOKEN_SECRETKEY as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as any
      },
      privateKey: process.env.JWT_REFRESH_TOKEN_SECRETKEY as string
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as any
      },
      privateKey: process.env.JWT_EMAIL_VERIFY_TOKEN_SECRETKEY as string
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as any
      },
      privateKey: process.env.JWT_FORGOT_PASSWORD_TOKEN_SECRETKEY as string
    })
  }

  private async signAccessRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify })
    ])

    return {
      access_token,
      refresh_token
    }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  private getOauthGoogleUserInfo = async (access_token: string, id_token: string) => {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name?: string
      family_name?: string
      picture: string
      locale?: string
    }
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_REFRESH_TOKEN_SECRETKEY as string
    })
  }

  async register(payload: RegisterRequestBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    // Create new user
    const newUser = new Users({
      ...payload,
      _id: user_id,
      email_verify_token,
      username: `user${user_id}`,
      date_of_birth: new Date(payload.date_of_birth),
      password: hashPassword(payload.password)
    })
    // Insert new user into the database
    await databaseService.users.insertOne(newUser)

    // const user_id = result.insertedId.toString()
    // Generate access and refresh tokens
    const { access_token, refresh_token } = await this.signAccessRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { exp, iat } = await this.decodeRefreshToken(refresh_token)
    // Insert refresh token into the database
    await databaseService.refreshTokens.insertOne(
      new RefreshTokenSchema({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        iat,
        exp
      })
    )
    // flow verify email like:
    // 1. server send email to user
    // 2. user click link in email to verify
    // 3. client send request to server with email_verify_token
    // 4. server verify email_verify_token and update user verify status
    // 5. client receive access_token and refresh_token
    // 6. client store access_token and refresh_token in local storage or cookie
    await sendVerifyEmailTemplate(payload.email, email_verify_token)

    return {
      access_token,
      refresh_token
    }
  }

  async getUserByEmail(email: string) {
    const user = await databaseService.users.findOne({ email })
    return user
  }

  async getUserById(user_id: string, projection: object = {}) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) }, { projection })
    return user
  }

  async login(payload: { email: string; password: string; verify: UserVerifyStatus }) {
    const user = await this.getUserByEmail(payload.email)
    if (!user) {
      throw new Error(USERS_MESSAGES.INVALID_CREDENTIALS)
    }
    if (user?.password !== hashPassword(payload.password)) {
      throw new Error(USERS_MESSAGES.INVALID_CREDENTIALS)
    }

    const user_id = user._id.toString()
    const { access_token, refresh_token } = await this.signAccessRefreshToken({
      user_id,
      verify: payload.verify
    })
    const { exp, iat } = await this.decodeRefreshToken(refresh_token)
    // Insert refresh token into the database
    await databaseService.refreshTokens.insertOne(
      new RefreshTokenSchema({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        iat,
        exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token_prams,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token_prams: string
    exp: number
  }) {
    const [access_token, refresh_token, result] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token_prams })
    ])
    const decoded_refresh_token = await this.decodeRefreshToken(refresh_token)
    // Insert refresh token into the database
    await databaseService.refreshTokens.insertOne(
      new RefreshTokenSchema({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async verifyEmail(user_id: string) {
    const [tokens] = await Promise.all([
      this.signAccessRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
            // updated_at: new Date() // ta co 2 options de cap nhat update_at( 1. minh tu tao gia tri cap nhat nhu new Date())
            // 2. de mongodb tu cap nhat-> thi de tu cap nhat chung ta co 2 cach
          },
          $currentDate: {
            updated_at: true // mongodb tu cap nhat cach 1 dung "currentDate"
          }
        }
        // [{ // mongodb tu cap nhat cach 2 dung "$$NOW"
        //   $set: {
        //     email_verify_token: '',
        //     verify: UserVerifyStatus.Verified,
        //     updated_at: "$$NOW"
        //   },
        // }]
      )
    ])
    const { access_token, refresh_token } = tokens
    const { exp, iat } = await this.decodeRefreshToken(refresh_token)
    // Insert refresh token into the database
    await databaseService.refreshTokens.insertOne(
      new RefreshTokenSchema({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        iat,
        exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async resendEmailVerify(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({ verify: UserVerifyStatus.Unverified, user_id })
    await sendVerifyEmailTemplate(email, email_verify_token)
    const result = await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token,
            verify: UserVerifyStatus.Unverified,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    if (result.modifiedCount === 1) {
      return {
        message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS,
        email_verify_token
      }
    }
  }

  async forgotPassword({ user_id, verify, email }: { user_id: string; verify: UserVerifyStatus; email: string }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    // sau khi update forgot_password_token xong thi gui email kem link den email nguoi dung co dang:
    // https://twitter.com/forgot-password?token=token
    await sendForgotPasswordEmail(email, forgot_password_token)
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword(user_id: string, password: string) {
    const result = await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token: '',
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    if (result.modifiedCount === 1) {
      return {
        message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
      }
    }
  }
  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeRequestBody }) {
    const _payload = payload?.date_of_birth ? { ...payload, date_of_birth: new Date(payload?.date_of_birth) } : payload
    const result = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ..._payload
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (!isEmpty(result)) {
      return {
        message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
        result
      }
    }
  }
  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HttpStatus.NotFound
      })
    }
    if (!isEmpty(user)) {
      return {
        message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
        user
      }
    }
  }
  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.follows.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower !== null) {
      return {
        message: USERS_MESSAGES.FOLLOWED
      }
    }
    const data = new FollowSchema({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    const result = await databaseService.follows.insertOne(data)
    if (!isEmpty(result)) {
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS,
        result
      }
    }
  }
  async unfollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.follows.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower !== null) {
      const result = await databaseService.follows.deleteOne({ _id: follower._id })
      if (!isEmpty(result)) {
        return {
          message: USERS_MESSAGES.UNFOLLOW_SUCCESS,
          result
        }
      }
    }
    return {
      message: USERS_MESSAGES.ALREADY_UNFOLLOWED
    }
  }
  async changePassword(user_id: string, password: string) {
    const result = await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    if (!isEmpty(result)) {
      return {
        message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS,
        result
      }
    }
  }
  async oauth(code: string) {
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getOauthGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HttpStatus.BadRequest
      })
    }
    const user = await this.getUserByEmail(userInfo.email)
    if (!isEmpty(user)) {
      const { access_token, refresh_token } = await this.signAccessRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      const { exp, iat } = await this.decodeRefreshToken(refresh_token)
      // Insert refresh token into the database
      const result = await databaseService.refreshTokens.insertOne(
        new RefreshTokenSchema({
          token: refresh_token,
          user_id: user._id,
          iat,
          exp
        })
      )
      if (!isEmpty(result)) {
        return { access_token, refresh_token, newUser: 0, verify: user.verify }
      }
    } else {
      const randomString = Math.random().toString(36).substring(2, 15)
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password: randomString,
        confirm_password: randomString
      })
      return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified }
    }
  }
}
export default new UsersService()
