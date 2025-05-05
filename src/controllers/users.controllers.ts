import { config } from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { pick } from 'lodash'
import { ObjectId } from 'mongodb'
import { join } from 'path'
import { HttpStatus, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import {
  ChangePasswordRequestBody,
  FollowRequestController,
  ForgotPasswordRequestBody,
  GetProfileRequestParams,
  LoginRequestBody,
  LogoutRequestBody,
  RefreshTokenRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  UnfollowParams,
  UpdateMeRequestBody
} from '~/models/requests/User.requests'
import Users from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersServices from '~/services/users.services'
config()

export const LoginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const { verify } = req.user as Users
  const { email, password } = req.body
  const result = await usersServices.login({ email, password, verify })
  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const OauthController = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.query
  const result = await usersServices.oauth(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result?.access_token}&refresh_token=${result?.refresh_token}&new_user=${result?.newUser}&verify=${result?.verify}`
  return res.redirect(urlRedirect)
}

export const RegisterController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  const result = await usersServices.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const LogoutController = async (req: Request<ParamsDictionary, any, LogoutRequestBody>, res: Response) => {
  const result = await usersServices.logout(req.body.refresh_token)
  return res.json(result)
}

export const RefreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenRequestBody>,
  res: Response
) => {
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload
  const result = await usersServices.refreshToken({
    user_id,
    verify,
    refresh_token_prams: req.body.refresh_token,
    exp
  })
  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const EmailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload

  const user = await usersServices.getUserById(user_id)
  // check if user is exist
  if (!user) {
    return res.status(HttpStatus.NotFound).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  // check if user is already verified before
  if (user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  const result = await usersServices.verifyEmail(user_id)

  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const ResendEmailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersServices.getUserById(user_id)

  if (!user) {
    return res.status(HttpStatus.NotFound).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  const result = await usersServices.resendEmailVerify(user_id, user.email)
  return res.json(result)
}

export const ForgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { _id, verify, email } = req.user as Users
  const result = await usersServices.forgotPassword({ user_id: (_id as ObjectId).toString(), verify, email })
  return res.json(result)
}

export const VerifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const user = await usersServices.getUserById(user_id)
  if (!user) {
    return res.status(HttpStatus.NotFound).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.forgot_password_token !== req.body.forgot_password_token) {
    return res.status(HttpStatus.Unauthorized).json({
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_INVALID
    })
  }
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}

export const ResetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { forgot_password_token, password } = req.body
  const user = await usersServices.getUserById(user_id)
  if (!user) {
    return res.status(HttpStatus.NotFound).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.forgot_password_token !== forgot_password_token) {
    return res.status(HttpStatus.Unauthorized).json({
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_INVALID
    })
  }
  const result = await usersServices.resetPassword(user_id, password)
  return res.json(result)
}

export const GetMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersServices.getUserById(user_id, {
    password: 0,
    email_verify_token: 0,
    forgot_password_token: 0
  })
  if (!user) {
    return res.status(HttpStatus.NotFound).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  return res.json({
    message: USERS_MESSAGES.GET_MY_PROFILE_SUCCESS,
    result: user
  })
}

export const UpdateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersServices.updateMe({ user_id, payload: req.body })
  return res.json(result)
}

export const GetProfileController = async (
  req: Request<GetProfileRequestParams>,
  res: Response,
  next: NextFunction
) => {
  const { username } = req.params
  const result = await usersServices.getProfile(username)
  return res.json(result)
}

export const FollowController = async (
  req: Request<ParamsDictionary, any, FollowRequestController>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  const result = await usersServices.follow(user_id, followed_user_id)
  return res.json(result)
}

export const UnfollowController = async (req: Request<UnfollowParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await usersServices.unfollow(user_id, followed_user_id)
  return res.json(result)
}

export const ChangePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersServices.changePassword(user_id, password)
  return res.json(result)
}
