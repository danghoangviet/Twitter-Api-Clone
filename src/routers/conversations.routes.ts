import { Router } from 'express'
import { ConversationTweetController } from '~/controllers/conversations.controllers'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, conversationValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const conversationsRouter = Router()
/**
 * Path: /receivers:/receiverId
 * Method: GET
 * Description: get conversation tweet
 * headers: {Authorization: Bearer <access_token>}
 * params: {receiverId: string}
 */
conversationsRouter.get(
  '/receivers/:receiverId',
  accessTokenValidator,
  verifiedUserValidator,
  conversationValidator,
  paginationValidator,
  wrapRequestHandler(ConversationTweetController)
)
export default conversationsRouter
