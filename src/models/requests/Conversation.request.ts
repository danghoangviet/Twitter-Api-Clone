import { ParamsDictionary } from 'express-serve-static-core'
export interface ConversationParams extends ParamsDictionary {
  receiverId: string
}
