import { config } from 'dotenv'
import { Request } from 'express'
import { unlinkSync } from 'fs'
import fsPromise from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMG_DIR } from '~/constants/dir'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { Media } from '~/models/Other'
import { isProduction } from '~/utils/config'
import { getNameFromFullName, handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '~/utils/files'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/videos'
import databaseService from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
config()

class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  async enqueue(item: string) {
    this.items.push(item)
    const idName = getNameFromFullName(item.split('\\').pop() as string)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: EncodingStatus.Pending
      })
    )
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const filePath = this.items[0]
      const idName = getNameFromFullName(filePath.split('\\').pop() as string)
      await databaseService.videoStatus.updateOne(
        {
          name: idName
        },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            update_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(filePath)
        this.items.shift()
        await fsPromise.unlink(filePath) // remove file mp4
        await databaseService.videoStatus.updateOne(
          {
            name: idName
          },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              update_at: true
            }
          }
        )
        console.log(`Encode video ${filePath} success`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name: idName
            },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                update_at: true
              }
            }
          )
          .catch((err) => console.error('Update status failed'))
        console.error(`Encode video ${filePath} error`)
        console.error('error: ', error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('Encode video queue is empty')
    }
  }
}

const queue = new Queue()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const name = getNameFromFullName(file.newFilename)
        const outputFilePath = path.resolve(UPLOAD_IMG_DIR, `${name}.jpg`)
        await sharp(file.filepath).jpeg().toFile(outputFilePath)
        unlinkSync(file.filepath)
        const imageURI = isProduction
          ? `${process.env.HOST}/static/images/${name}.jpg`
          : `http://localhost:${process.env.PORT}/static/images/${name}.jpg`
        return {
          url: imageURI,
          type: MediaType.Image
        }
      })
    )
    return result
  }
  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = files.map((file) => {
      const videoURI = isProduction
        ? `${process.env.HOST}/static/video/${file.newFilename}`
        : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`
      return {
        url: videoURI,
        type: MediaType.Video
      }
    })
    return result
  }
  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideoHLS(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const name = getNameFromFullName(file.newFilename)
        queue.enqueue(file.filepath)
        const videoURI = isProduction
          ? `${process.env.HOST}/static/video-hls/${name}.m3u8`
          : `http://localhost:${process.env.PORT}/static/video-hls/${name}.m3u8`
        return {
          url: videoURI,
          type: MediaType.HLS
        }
      })
    )
    return result
  }
  async getVideoStatus(id: string) {
    const result = await databaseService.videoStatus.findOne({ name: id })
    return result
  }
}

const mediasService = new MediasService()
export default mediasService
