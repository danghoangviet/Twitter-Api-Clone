import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { HttpStatus, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import usersServices from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
  in: ['body'],
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: { min: 6 },
    errorMessage: USERS_MESSAGES.PASSWORD_MIN_LENGTH
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.PASSWORD_STRONG
  },
  trim: true
}

const confirmPasswordSchema: ParamSchema = {
  in: ['body'],
  notEmpty: true,
  errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED,
  trim: true,
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.PASSWORD_DO_NOT_MATCH)
      }
      return true
    }
  }
}

const forGotPasswordSchema: ParamSchema = {
  in: ['body'],
  notEmpty: {
    errorMessage: new ErrorWithStatus({
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
      status: HttpStatus.Unauthorized
    })
  },
  custom: {
    options: async (values: string, { req }) => {
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: values,
          secretOrPublicKey: process.env.JWT_FORGOT_PASSWORD_TOKEN_SECRETKEY as string
        })

        ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        throw new ErrorWithStatus({
          message: capitalize((error as JsonWebTokenError).message),
          status: HttpStatus.Unauthorized
        })
      }
      return true
    }
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  in: ['body'],
  isString: true,
  isLength: {
    options: { min: 1 },
    errorMessage: USERS_MESSAGES.IMG_URL_MIN_LENGTH
  },
  trim: true
}

const nameSchema: ParamSchema = {
  in: ['body'],
  isString: true,
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isLength: {
    options: { min: 1 },
    errorMessage: USERS_MESSAGES.NAME_MIN_LENGTH
  },
  trim: true
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.INVALID_DATE_FORMAT
  }
}

const userIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: new ErrorWithStatus({
      message: USERS_MESSAGES.USERID_IS_REQUIRED,
      status: HttpStatus.Unauthorized
    })
  },
  isString: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_INVALID,
          status: HttpStatus.BadRequest
        })
      }
      const user = await usersServices.getUserById(value)
      if (user === null) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HttpStatus.NotFound
        })
      }
      req.user = user
      return true
    }
  }
}

const loginValidator = validate(
  checkSchema(
    {
      email: {
        in: ['body'],
        isEmail: true,
        errorMessage: USERS_MESSAGES.INVALID_EMAIL_FORMAT,
        normalizeEmail: true, // Normalize email to lowercase
        trim: true,
        custom: {
          options: async (value, { req }) => {
            // // Check if user already exists
            const existingUser = await usersServices.getUserByEmail(value)
            if (!existingUser) {
              throw new Error(USERS_MESSAGES.INVALID_CREDENTIALS)
            }
            req.user = existingUser
            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)

const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        in: ['body'],
        isEmail: true,
        errorMessage: USERS_MESSAGES.INVALID_EMAIL_FORMAT,
        normalizeEmail: true, // Normalize email to lowercase
        trim: true,
        custom: {
          options: async (value, { req }) => {
            // // Check if user already exists
            const existingUser = await usersServices.getUserByEmail(value)
            if (existingUser) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HttpStatus.Conflict
              })
            }
            req.user = existingUser
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        in: ['headers'],
        notEmpty: {
          errorMessage: new ErrorWithStatus({
            message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
            status: HttpStatus.Unauthorized
          })
        },
        // errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        custom: {
          options: async (value: string, { req }) => {
            if (!value.startsWith('Bearer ')) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_INVALID,
                status: HttpStatus.Unauthorized
              })
            }
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_INVALID,
                status: HttpStatus.Unauthorized
              })
            }

            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.JWT_ACCESS_TOKEN_SECRETKEY as string
              })
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HttpStatus.Unauthorized
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      in: ['body'],
      notEmpty: {
        errorMessage: new ErrorWithStatus({
          message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
          status: HttpStatus.Unauthorized
        })
      },
      custom: {
        options: async (values: string, { req }) => {
          try {
            const [decoded_refresh_token, refresh_token] = await Promise.all([
              verifyToken({ token: values, secretOrPublicKey: process.env.JWT_REFRESH_TOKEN_SECRETKEY as string }),
              databaseService.refreshTokens.findOne({ token: values })
            ])
            if (!refresh_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_IS_NOT_EXIST_OR_USED,
                status: HttpStatus.Unauthorized
              })
            }

            ;(req as Request).decoded_refresh_token = decoded_refresh_token
            return true
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({
                message: capitalize(error.message),
                status: HttpStatus.Unauthorized
              })
            }
            throw error
          }
        }
      }
    }
  })
)

const emailTokenValidator = validate(
  checkSchema({
    email_verify_token: {
      in: ['body'],
      notEmpty: {
        errorMessage: new ErrorWithStatus({
          message: USERS_MESSAGES.EMAIL_TOKEN_IS_REQUIRED,
          status: HttpStatus.Unauthorized
        })
      },
      custom: {
        options: async (values: string, { req }) => {
          try {
            const decoded_email_verify_token = await verifyToken({
              token: values,
              secretOrPublicKey: process.env.JWT_EMAIL_VERIFY_TOKEN_SECRETKEY as string
            })

            ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
          } catch (error) {
            throw new ErrorWithStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: HttpStatus.Unauthorized
            })
          }
          return true
        }
      }
    }
  })
)

const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        in: ['body'],
        isEmail: true,
        errorMessage: USERS_MESSAGES.INVALID_EMAIL_FORMAT,
        normalizeEmail: true, // Normalize email to lowercase
        trim: true,
        custom: {
          options: async (value, { req }) => {
            // // Check if user already exists
            const user = await usersServices.getUserByEmail(value)
            if (user === null) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HttpStatus.NotFound
              })
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

const verifyForgotPasswordValidator = validate(
  checkSchema({
    forgot_password_token: {
      in: ['body'],
      notEmpty: {
        errorMessage: new ErrorWithStatus({
          message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HttpStatus.Unauthorized
        })
      },
      custom: {
        options: async (values: string, { req }) => {
          try {
            const decoded_forgot_password_token = await verifyToken({
              token: values,
              secretOrPublicKey: process.env.JWT_FORGOT_PASSWORD_TOKEN_SECRETKEY as string
            })

            ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
          } catch (error) {
            throw new ErrorWithStatus({
              message: capitalize((error as JsonWebTokenError).message),
              status: HttpStatus.Unauthorized
            })
          }
          return true
        }
      }
    }
  })
)

const resetPasswordValidator = validate(
  checkSchema({
    password: passwordSchema,
    confirm_password: confirmPasswordSchema,
    forgot_password_token: forGotPasswordSchema
  })
)
const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFIED,
        status: HttpStatus.Forbidden
      })
    )
  }
  next()
}

const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        ...nameSchema,
        notEmpty: undefined
      },
      date_of_birth: {
        optional: true,
        ...dateOfBirthSchema
      },
      bio: {
        optional: true,
        in: ['body'],
        isString: true,
        isLength: {
          options: { min: 1 },
          errorMessage: USERS_MESSAGES.BIO_MIN_LENGTH
        },
        trim: true
      },
      location: {
        optional: true,
        in: ['body'],
        isString: true,
        isLength: {
          options: { min: 1 },
          errorMessage: USERS_MESSAGES.LOCATION_MIN_LENGTH
        },
        trim: true
      },
      website: {
        optional: true,
        in: ['body'],
        isString: true,
        isLength: {
          options: { min: 1 },
          errorMessage: USERS_MESSAGES.WEBSITE_MIN_LENGTH
        },
        trim: true
      },
      username: {
        optional: true,
        in: ['body'],
        isString: true,
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!REGEX_USERNAME.test(value)) {
              throw new Error(USERS_MESSAGES.USERNAME_INVALID)
            }
            const user = await databaseService.users.findOne({ username: value })
            if (user) {
              throw new Error(USERS_MESSAGES.USERNAME_EXISTED)
            }
            return true
          }
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

const followValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['body']
  )
)

const unfollowValidator = validate(
  checkSchema(
    {
      user_id: userIdSchema
    },
    ['params']
  )
)

const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      ...passwordSchema,
      custom: {
        options: async (value, { req }) => {
          const { user_id } = req.decoded_authorization as TokenPayload
          const user = await usersServices.getUserById(user_id)
          if (!user) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HttpStatus.NotFound
            })
          }
          if (user.password !== hashPassword(value)) {
            throw new Error(USERS_MESSAGES.PASSWORD_DO_NOT_MATCH)
          }
          return true
        }
      }
    },
    password: {
      ...passwordSchema,
      custom: {
        options: (value, { req }) => {
          if (req.body.old_password && value === req.body.old_password) {
            throw new Error(USERS_MESSAGES.NEW_PASSWORD_DO_NOT_SAME_OLD_PASSWORD)
          }
          return true
        }
      }
    },
    confirm_password: confirmPasswordSchema
  })
)

const isUserLoggedInValidator = (middleware: (req: Request, res: Response, nex: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next)
    }
    next()
  }
}

export {
  emailTokenValidator,
  loginValidator,
  registerValidator,
  accessTokenValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  verifyForgotPasswordValidator,
  resetPasswordValidator,
  verifiedUserValidator,
  updateMeValidator,
  followValidator,
  unfollowValidator,
  changePasswordValidator,
  isUserLoggedInValidator
}
