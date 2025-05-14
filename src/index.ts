import express from 'express'
import usersRouter from './routers/users.routes'
import databaseService from './services/database.services'
import defaultErrorHandler from './middlewares/error.middlewares'
import { ErrorRequestHandler } from 'express-serve-static-core'
import mediasRouter from './routers/medias.routes'
import staticRouter from './routers/static.routes'
import cors from 'cors'
import { initFolder } from './utils/files'
import { UPLOAD_IMG_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import tweetsRouter from './routers/tweets.routes'
import bookmarksRouter from './routers/bookmarks.routes'
import likesRouter from './routers/likes.routes'
import searchRouter from './routers/search.routes'
import { createServer } from 'http'

import conversationsRouter from './routers/conversations.routes'
import initSocket from './utils/socket'

import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { envConfig } from './utils/config'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Swagger X (Twitter API) Clone',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routers/*.routes.ts', './src/models/requests/*.requests.ts'] // files containing annotations as above
}

const openapiSpecification = swaggerJsdoc(options)
// const file = readFileSync(path.resolve('swagger.yaml'), 'utf8')
// const swaggerDocument = YAML.parse(file)

// import '~/utils/fake'
// import '~/utils/s3'
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexVideoStatus()
  databaseService.indexFollows()
  databaseService.indexTweets()
}) // Call the MongoDB connection function

const app = express()
const httpServer = createServer(app)
const port = envConfig.port || 4000

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification))

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
app.use('/conversations', conversationsRouter)

// middleware to handle errors
app.use(defaultErrorHandler as ErrorRequestHandler)

// use socket io
initSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
