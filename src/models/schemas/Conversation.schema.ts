import { ObjectId } from 'mongodb'

interface ConversationType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  message: string
  create_at?: Date
  update_at?: Date
}

export default class Conversation {
  _id: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  message: string
  create_at: Date
  update_at: Date
  constructor({ _id, sender_id, receiver_id, message, create_at, update_at }: ConversationType) {
    const date = new Date()
    this._id = _id || new ObjectId()
    this.sender_id = new ObjectId(sender_id)
    this.message = message
    this.receiver_id = new ObjectId(receiver_id)
    this.create_at = create_at || date
    this.update_at = update_at || date
  }
}
