import { Server } from 'socket.io'
import Conversation from '../models/schemas/Conversation.schema'
import { verifyAccessToken } from '../utils/commons'
import { TokenPayload } from '../models/requests/User.requests'
import { HttpStatus, UserVerifyStatus } from '../constants/enum'
import { ErrorWithStatus } from '../models/Errors'
import { USERS_MESSAGES } from '../constants/messages'
import databaseService from '~/services/database.services'
import { Server as HttpServer } from 'http'

const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000'
    }
  })

  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    try {
      const decoded_authorization = await verifyAccessToken(Authorization)
      const { verify } = decoded_authorization as TokenPayload
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_VERIFIED,
          status: HttpStatus.Forbidden
        })
      }
      socket.handshake.auth.decoded_authorization = decoded_authorization
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })
  const users = new Map<string, { socket_id: string }>()

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`)
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    users.set(user_id, {
      socket_id: socket.id
    })

    socket.use(async (packet, next) => {
      const { Authorization } = socket.handshake.auth
      try {
        await verifyAccessToken(Authorization)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    socket.on('send_message', async (data) => {
      const { payload } = data
      const receiver_socket_id = users.get(payload.receiver_id)?.socket_id
      const conversation = new Conversation({
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id,
        message: payload.message
      })
      const result = await databaseService.conversations.insertOne(conversation)
      conversation._id = result.insertedId
      if (receiver_socket_id) {
        io.to(receiver_socket_id).emit('receive_message', {
          payload: conversation
        })
      }
    })

    socket.on('disconnect', () => {
      // remove user from map
      users.delete(user_id)
      console.log(`User disconnected: ${socket.id}`)
    })
  })
}

export default initSocket
