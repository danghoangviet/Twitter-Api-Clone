import { NextFunction, Request, Response } from 'express'
import { ConversationParams } from '~/models/requests/Conversation.request'
import { TokenPayload } from '~/models/requests/User.requests'
import conversationService from '~/services/conversation.services'

export const ConversationTweetController = async (
  req: Request<ConversationParams>,
  res: Response,
  next: NextFunction
) => {
  const { receiverId } = req.params
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await conversationService.getConversations({
    sender_id: user_id,
    receiver_id: receiverId,
    limit,
    page
  })
  return res.json({
    message: 'Get conversation tweet successfully',
    result: {
      limit,
      page,
      total: Math.ceil(result.total / limit),
      conversation: result.conversations
    }
  })
}
