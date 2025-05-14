import { Router } from 'express'
import {
  ChangePasswordController,
  EmailVerifyController,
  FollowController,
  ForgotPasswordController,
  GetMeController,
  GetProfileController,
  LoginController,
  LogoutController,
  OauthController,
  RefreshTokenController,
  RegisterController,
  ResendEmailVerifyController,
  ResetPasswordController,
  UnfollowController,
  UpdateMeController,
  VerifyForgotPasswordController
} from '~/controllers/users.controllers'
import { filterMiddleWare } from '~/middlewares/common.middlewares'
import {
  loginValidator,
  registerValidator,
  accessTokenValidator,
  refreshTokenValidator,
  emailTokenValidator,
  forgotPasswordValidator,
  verifyForgotPasswordValidator,
  resetPasswordValidator,
  verifiedUserValidator,
  updateMeValidator,
  followValidator,
  unfollowValidator,
  changePasswordValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeRequestBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags:
 *       - users
 *     summary: Đăng nhập
 *     description: Đăng nhập vào hệ thống
 *     operationId: loginUser
 *     requestBody:
 *       description: Thông tin đăng nhập
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/loginUser'
 *     responses:
 *       '200':
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successfully
 *                 result:
 *                   $ref: '#/components/schemas/successAuthentication'
 *       '422':
 *         description: Invalid input
 */

usersRouter.post('/login', loginValidator, wrapRequestHandler(LoginController))
/**
 * Path: /oauth/google
 * Method: GET
 * Description: oauth with gg
 * Query: { code: string }
 */
usersRouter.get('/oauth/google', wrapRequestHandler(OauthController))
/**
 * Path: /register
 * Method: POST
 * Description: register user
 * Body: { email: string, password: string, name: string, confirm_password: string, date_of_birth: string, }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(RegisterController))
/**
 * Path: /logout
 * Method: POST
 * Description: Logout user
 * Header: { Authorization: Bearer <access_token>}
 * Request body: { refresh_token: string}
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(LogoutController))
/**
 * Path: /refresh-token
 * Method: POST
 * Description: Refresh Token
 * Request body: { refresh_token: string}
 */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(RefreshTokenController))
/**
 * Path: /verify-email
 * Method: POST
 * Description: Verify user
 * Request body: { email_verify_token: string}
 */
usersRouter.post('/verify-email', emailTokenValidator, wrapRequestHandler(EmailVerifyController))
/**
 * Path: /resend-verify-email
 * Method: POST
 * Description: resend Verify user
 * Header: { Authorization: Bearer <access_token>}
 * Request body: { }
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(ResendEmailVerifyController))
/**
 * Path: /forgot-password
 * Method: POST
 * Description: forgot -password
 * Request body: { email: string }
 */
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(ForgotPasswordController))
/**
 * Path: /verify-forgot-password-token
 * Method: POST
 * Description: forgot password token
 * Header: { Authorization: Bearer <access_token>}
 * Request body: { forgot-password-token: string }
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapRequestHandler(VerifyForgotPasswordController)
)
/**
 * Path: /reset-password
 * Method: POST
 * Description: reset password
 * Header: { Authorization: Bearer <access_token>}
 * Request body: { password: string, confirm_password: string, forgot_password_token: string }
 */
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(ResetPasswordController))
/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - users
 *     summary: Lấy thông tin người dùng
 *     description: Lấy thông tin người dùng hiện tại
 *     operationId: getCurrUser
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       default:
 *         description: Lấy thông tin người dùng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Get my profile success
 *                 result:
 *                   $ref: '#/components/schemas/UserProfile'
 */

usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(GetMeController))
/**
 * Path: /me
 * Method: PATCH
 * Description: update user info
 * Header: { Authorization: Bearer <access_token>}
 * body: UserSchema
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleWare<UpdateMeRequestBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(UpdateMeController)
)
/**
 * Path: /username
 * Method: GET
 * Description: get profile info
 */
usersRouter.get('/:username', wrapRequestHandler(GetProfileController))
/**
 * Path: /follow
 * Method: POST
 * Description: follow someone
 * Header: { Authorization: Bearer <access_token>}
 * Verified
 * Body: { followed_user_id: string }
 */
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(FollowController)
)
/**
 * Path: /follow/:user_id
 * Method: DELETE
 * Description: unfollow user
 * Header: { Authorization: Bearer <access_token>}
 * Verified
 */
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(UnfollowController)
)
/**
 * Path: /change-password
 * Method: POST
 * Description: change password
 * Header: { Authorization: Bearer <access_token>}
 * Verified
 * Body: { old_password: string, password: string, confirm_password: string }
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(ChangePasswordController)
)

export default usersRouter
