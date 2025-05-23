export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MIN_LENGTH: 'Name must be at least 1 character long',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long',
  PASSWORD_STRONG:
    'Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MIN_LENGTH: 'Confirm password must be at least 6 characters long',
  PASSWORD_DO_NOT_MATCH: 'Passwords do not match',
  INVALID_DATE_FORMAT: 'Invalid date format. Date must be in ISO 8601 format.',
  LOGIN_SUCCESS: 'Login successfully',
  REGISTER_SUCCESS: 'Register successfully',
  REFRESH_TOKEN_SUCCESS: 'Refresh token successfully',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  ACCESS_TOKEN_IS_INVALID: 'Access token is invalid',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
  REFRESH_TOKEN_IS_NOT_EXIST_OR_USED: 'Refresh token is not exist or used',
  LOGOUT_SUCCESS: 'Logout successfully',
  EMAIL_TOKEN_IS_REQUIRED: 'Email verify token is required',
  USER_NOT_FOUND: 'User not found',
  USER_INVALID: 'User is invalid',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email already verified before',
  EMAIL_VERIFY_SUCCESS: 'Email verify successfully',
  RESEND_EMAIL_VERIFY_SUCCESS: 'Resend email verify successfully',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Verify forgot password success',
  FORGOT_PASSWORD_TOKEN_INVALID: 'Forgot password token is invalid',
  RESET_PASSWORD_SUCCESS: 'Reset password success',
  GET_MY_PROFILE_SUCCESS: 'Get my profile success',
  USER_NOT_VERIFIED: 'User not verified',
  GMAIL_NOT_VERIFIED: 'Gmail not verified',
  BIO_MIN_LENGTH: 'Bio must be at least 1 character long',
  LOCATION_MIN_LENGTH: 'Location must be at least 1 character long',
  WEBSITE_MIN_LENGTH: 'Website must be at least 1 character long',
  USERNAME_INVALID:
    'Username must be 4-15 characters long and contains only letters, numbers, and underscores, not only number',
  IMG_URL_MIN_LENGTH: 'Image url must be at least 1 character long',
  UPDATE_ME_SUCCESS: 'Update profile success',
  GET_PROFILE_SUCCESS: 'Get profile success',
  FOLLOW_SUCCESS: 'Follow success',
  USERID_IS_REQUIRED: 'User id is required',
  FOLLOWED: 'Followed',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  ALREADY_UNFOLLOWED: 'Already unfollowed',
  USERNAME_EXISTED: 'Username existed',
  CHANGE_PASSWORD_SUCCESS: 'Change password success',
  NEW_PASSWORD_DO_NOT_SAME_OLD_PASSWORD: 'New password do not the same old password',
  UPLOAD_SUCCESS: 'Upload successfully',
  GET_VIDEO_STATUS_SUCCESS: 'Get video status success'
} as const

export const TWEETS_MESSAGES = {
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid audience',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent id must be a valid tweet id',
  PARENT_ID_MUST_BE_NULL: 'Parent id must be null',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non empty string',
  CONTENT_MUST_BE_NULL: 'Content must be empty',
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtag must be an array of string',
  MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID: 'Mentions must be an array of user id',
  MEDIA_MUST_BE_AN_ARRAY_OF_MEDIA_TYPES: 'Media must be an array of user id',
  CREATE_SUCCESS: 'Create Tweet Successfully',
  INVALID_TWEET_ID: 'Invalid tweet id',
  TWEET_NOT_FOUND: 'Tweet not found',
  TWEET_IS_NOT_PUBLIC: 'Tweet is not public',
  GET_TWEET_SUCCESS: 'Get tweet successfully',
  GET_TWEET_CHILDREN_SUCCESS: 'Get  children successfully',
  GET_NEW_FEEDS_SUCCESS: 'Get new feeds successfully'
} as const

export const BOOKMARK_MESSAGES = {
  BOOKMARK_SUCCESS: 'Bookmark Successfully',
  UNBOOKMARK_SUCCESS: 'UnBookmark Successfully'
} as const

export const LIKE_MESSAGES = {
  LIKE_SUCCESS: 'Like Successfully',
  UNLIKE_SUCCESS: 'Unlike Successfully'
} as const
