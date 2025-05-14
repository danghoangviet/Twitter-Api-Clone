import { ParamsDictionary } from 'express-serve-static-core'
import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
/**
 * @swagger
 * components:
 *   schemas:
 *     loginUser:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           example: danghoangviet2000@gmail.com
 *         password:
 *           type: string
 *           example: 123456aA@
 *
 *     successAuthentication:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refresh_token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: MongoId
 *           example: 67f64cce45ed03530c42c0c7
 *         name:
 *           type: string
 *           example: viedaica
 *         email:
 *           type: string
 *           format: email
 *           example: danghoangviet2000@gmail.com
 *         date_of_birth:
 *           type: string
 *           format: date-time
 *           example: 2025-09-06T08:26:33.781Z
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2025-04-09T10:32:46.710Z
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: 2025-04-15T08:36:38.972Z
 *         verify:
 *           $ref: '#/components/schemas/UserVerifyStatus'
 *         bio:
 *           type: string
 *           example: test bio
 *         location:
 *           type: string
 *           example: ""
 *         website:
 *           type: string
 *           example: ""
 *         username:
 *           type: string
 *           example: viet1
 *         avatar:
 *           type: string
 *           example: ""
 *         cover_photo:
 *           type: string
 *           example: ""
 *
 *     UserVerifyStatus:
 *       type: number
 *       enum: [0, 1, 2]  # Unverified = 0, Verified = 1, Banned = 2
 *       example: 1
 */

export interface LoginRequestBody {
  email: string
  password: string
}

export interface RegisterRequestBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface LogoutRequestBody {
  refresh_token: string
}
export interface RefreshTokenRequestBody {
  refresh_token: string
}

export interface ForgotPasswordRequestBody {
  forgot_password_token: string
}

export interface ResetPasswordRequestBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  verify: UserVerifyStatus
  token_type: TokenType
  exp: number
  iat: number
}

export interface UpdateMeRequestBody {
  name?: string
  date_of_birth?: Date
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export interface FollowRequestController {
  followed_user_id: string
}

export interface GetProfileRequestParams extends ParamsDictionary {
  username: string
}

export interface UnfollowParams extends ParamsDictionary {
  user_id: string
}

export interface ChangePasswordRequestBody {
  old_password: string
  password: string
  confirm_password: string
}
