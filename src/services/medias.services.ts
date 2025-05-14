import { Request } from 'express'
import { unlinkSync } from 'fs'
import fsPromise from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMG_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { Media } from '~/models/Other'
import { envConfig, isProduction } from '~/utils/config'
import {
  getFiles,
  getNameFromFullName,
  handleUploadImage,
  handleUploadVideo,
  handleUploadVideoHLS
} from '~/utils/files'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/videos'
import databaseService from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'

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
        const files = getFiles(path.resolve(UPLOAD_VIDEO_DIR, idName))
        await Promise.all(
          files.map((filePath) => {
            const fileName = 'videos-hls/' + filePath.replace(UPLOAD_VIDEO_DIR + '\\', '')
            return uploadFileToS3({
              filePath,
              fileName,
              contentType: mime.getType(filePath) as string
            })
          })
        )
        await Promise.all([
          fsPromise.unlink(filePath), // remove file mp4
          fsPromise.rm(path.resolve(UPLOAD_VIDEO_DIR, idName), {
            recursive: true, // xóa đệ quy
            force: true // bỏ qua lỗi nếu folder không tồn tại
          }) // remove folder video hls after upload to s3
        ])
        // cach 2: rimrafSync(path.resolve(UPLOAD_VIDEO_DIR, idName))
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
        const fileName = `${name}.jpg`
        const outputFilePath = path.resolve(UPLOAD_IMG_DIR, fileName)
        await sharp(file.filepath).jpeg().toFile(outputFilePath) // convert to jpg to save space
        const s3Result = await uploadFileToS3({
          fileName: 'images/' + fileName,
          filePath: outputFilePath,
          contentType: mime.getType(outputFilePath) as string // use mime to get content type of file
        })
        Promise.all([
          fsPromise.unlink(file.filepath), // remove file temp after upload to s3
          fsPromise.unlink(outputFilePath) // remove file jpg after upload to s3
        ])
        unlinkSync(file.filepath)
        // const imageURI = isProduction
        //   ? `${process.env.HOST}/static/images/${name}.jpg`
        //   : `http://localhost:${process.env.PORT}/static/images/${name}.jpg`
        // return {
        //   url: imageURI,
        //   type: MediaType.Image
        // }
        return {
          url: s3Result.Location as string,
          type: MediaType.Image
        }
      })
    )
    return result
  }
  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        console.log('file.newFilename: ', file.newFilename)
        const s3Result = await uploadFileToS3({
          fileName: 'videos/' + file.newFilename,
          filePath: file.filepath,
          contentType: mime.getType(file.filepath) as string // use mime to get content type of file
        })
        // const videoURI = isProduction
        //   ? `${process.env.HOST}/static/video/${file.newFilename}`
        //   : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`
        // return {
        //   url: videoURI,
        //   type: MediaType.Video
        // }
        // remove file temp after upload to s3
        fsPromise.unlink(file.filepath)
        return {
          url: s3Result.Location as string,
          type: MediaType.Video
        }
      })
    )
    return result
  }
  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideoHLS(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const name = getNameFromFullName(file.newFilename)
        queue.enqueue(file.filepath)
        const videoURI = isProduction
          ? `${envConfig.host}/static/video-hls/${name}/master.m3u8`
          : `http://localhost:${envConfig.port}/static/video-hls/${name}/master.m3u8`
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
