import { Request } from 'express'
import formidable, { File } from 'formidable'
import { existsSync, mkdirSync, renameSync, rmSync } from 'fs'
import { isEmpty } from 'lodash'
import path from 'path'
import { nanoid } from 'nanoid'
import { UPLOAD_IMG_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'

export const initFolder = () => {
  ;[UPLOAD_IMG_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, {
        recursive: true // muc dich la de tao folder nested(long nhau),
        // vd: tao folder images trong uploads/images -> khong co recursive = true thi se k tao dc
      })
    }
  })
  return
}

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMG_TEMP_DIR, // setup to save file at ...\TwitterClone\server\uploads folder
    maxFiles: 4, // max file upload in 1 times
    keepExtensions: true, // save all name file, ex: keepExtensions ? abc.jpg : abc
    maxFileSize: 300 * 1024, // 300KB
    maxTotalFileSize: 300 * 1024 * 4,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  // neu bi loi thi fix
  // const formidable = (await import('formidable')).default
  // const form = formidable({})
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (isEmpty(files)) {
        return reject(new Error('File should be not empty'))
      }
      resolve(files.image as File[])
    })
  })
}

// Cach xu ly khi upload video va encode
// co 2 giai doan (upload thanh cong thi bao cho user con encode cu de server nodejs chay ngam)
// upload video: upload video thanh cong thi resolve ve cho nguoi dung
// encode video: khai bao them 1 url endpoint de check xem video do da encode xong chua

export const handleUploadVideo = async (req: Request) => {
  // const idName = nanoid()
  // const folderPath = UPLOAD_VIDEO_DIR
  // mkdirSync(folderPath)
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR, // setup to save file at ...\TwitterClone\server\uploads folder
    maxFiles: 1, // max file upload in 1 times
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && (Boolean(mimetype?.includes('mp4')) || Boolean(mimetype?.includes('quicktime')))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
    // filename: function () {
    //   return idName
    // }
  })
  // neu bi loi thi fix
  // const formidable = (await import('formidable')).default
  // const form = formidable({})
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        // rmSync(folderPath, { recursive: true, force: true })
        return reject(err)
      }
      if (isEmpty(files.video)) {
        // rmSync(folderPath, { recursive: true, force: true })
        return reject(new Error('File should be not empty'))
      }
      const videoFiles = files.video as File[]
      videoFiles.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        renameSync(video.filepath, `${video.filepath}.${ext}`)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
      })

      resolve(files.video as File[])
    })
  })
}

export const handleUploadVideoHLS = async (req: Request) => {
  const idName = nanoid()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath, // setup to save file at ...\TwitterClone\server\uploads folder
    maxFiles: 1, // max file upload in 1 times
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && (Boolean(mimetype?.includes('mp4')) || Boolean(mimetype?.includes('quicktime')))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename: function () {
      return idName
    }
  })
  // neu bi loi thi fix
  // const formidable = (await import('formidable')).default
  // const form = formidable({})
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        rmSync(folderPath, { recursive: true, force: true })
        return reject(err)
      }
      if (isEmpty(files.video)) {
        rmSync(folderPath, { recursive: true, force: true })
        return reject(new Error('File should be not empty'))
      }
      const videoFiles = files.video as File[]
      videoFiles.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        renameSync(video.filepath, `${video.filepath}.${ext}`)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
      })

      resolve(files.video as File[])
    })
  })
}

export const getNameFromFullName = (fullname: string) => {
  const nameArr = fullname.split('.')[0]
  return nameArr
}

export const getExtension = (fullname: string) => {
  const nameArr = fullname.split('.')
  return nameArr[nameArr.length - 1]
}
