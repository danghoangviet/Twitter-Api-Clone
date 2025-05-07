import express from 'express'
import usersRouter from './routers/users.routes'
import databaseService from './services/database.services'
import defaultErrorHandler from './middlewares/error.middlewares'
import { ErrorRequestHandler } from 'express-serve-static-core'
import mediasRouter from './routers/medias.routes'
import staticRouter from './routers/static.routes'
import cors from 'cors'
import { initFolder } from './utils/files'
import { config } from 'dotenv'
import { UPLOAD_IMG_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import tweetsRouter from './routers/tweets.routes'
import bookmarksRouter from './routers/bookmarks.routes'
import likesRouter from './routers/likes.routes'
import searchRouter from './routers/search.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
// import '~/utils/fake'
// import '~/utils/s3'
config()

databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexVideoStatus()
  databaseService.indexFollows()
  databaseService.indexTweets()
}) // Call the MongoDB connection function
const app = express()
// use web socket io
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

const users = new Map<string, { socket_id: string }>()

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  console.log(socket.handshake.auth)
  const user_id = socket.handshake.auth._id
  users.set(user_id, {
    socket_id: socket.id
  })

  socket.on('private_message', (data) => {
    const receiver_socket_id = users.get(data.to)?.socket_id
    if (receiver_socket_id) {
      io.to(receiver_socket_id).emit('receiver_private_message', {
        from: user_id,
        message: data.message
      })
    }
  })

  socket.on('disconnect', () => {
    // remove user from map
    users.delete(user_id)
    console.log(`User disconnected: ${socket.id}`)
  })
})
const port = process.env.PORT || 4000

// create folder upload
initFolder()

app.use(express.json()) // Middleware to parse JSON bodies
app.use(cors())

app.use('/users', usersRouter) // Mount the users router on the /users path
app.use('/medias', mediasRouter) // Mount the medias router on the /medias path
app.use('/tweets', tweetsRouter) // Mount the tweets router on the /tweets path
app.use('/bookmarks', bookmarksRouter) // Mount the bookmarks router on the /bookmarks path
app.use('/likes', likesRouter) // Mount the bookmarks router on the /bookmarks path
app.use('/search', searchRouter)
app.use('/static/images', express.static(UPLOAD_IMG_DIR)) //Servicing static file -> use express.static
app.use('/static', staticRouter) //Servicing static file -> custom
app.use(
  '/static/video',
  express.static(UPLOAD_VIDEO_DIR, {
    // mỗi lần serve, override header cho .mp4
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4')) {
        // ép Content-Type chính xác
        res.setHeader('Content-Type', 'video/mp4')
        // buộc mở inline
        res.setHeader('Content-Disposition', 'inline')
      }
    }
  })
)

// middleware to handle errors
app.use(defaultErrorHandler as ErrorRequestHandler)

httpServer.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
