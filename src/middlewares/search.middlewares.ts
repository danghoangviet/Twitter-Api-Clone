import { checkSchema } from 'express-validator'
import { MediaTypeQuery, PeopleFollow } from '~/constants/enum'
import { validate } from '~/utils/validation'

export const searchValidator = validate(
  checkSchema({
    content: {
      isString: true
    },
    media_type: {
      optional: true,
      isIn: {
        options: [Object.values(MediaTypeQuery)]
      }
    },
    people_follow: {
      optional: true,
      isIn: {
        options: [Object.values(PeopleFollow)]
      }
    }
  })
)
