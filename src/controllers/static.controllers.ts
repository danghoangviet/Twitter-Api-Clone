import { NextFunction, Request, Response } from 'express'
import { createReadStream, statSync } from 'fs'
import mime from 'mime'
import path from 'path'
import { UPLOAD_IMG_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { HttpStatus } from '~/constants/enum'
import { sendFileFromS3 } from '~/utils/s3'
export const handleServeImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(`${UPLOAD_IMG_DIR}/${name}`, (err) => {
    if (err) {
      res.status((err as any).status).send(err)
    }
  })
}
export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const { range } = req.headers
  if (!range) {
    return res.status(HttpStatus.BadRequest).send('Requires Range header')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  // 1MB = 10^6 bytes(Tinh theo he 10, day la thu chung ta hay thay tren UI)
  // Con tinh thep he nhi phan thi 1MB = 2^20 bytes (1024 * 1024)

  // Dung luong video
  const videoSize = statSync(videoPath).size
  // Dung luong video cho moi phan doan stream
  const chuckSize = 10 ** 6 // 1MB
  // Lay gia tri byte bat dau tu header Range (vd: bytes=1048576-)
  const start = Number(range.replace(/\D/g, '')) //  range.replace(/\D/g, '') sẽ loại bỏ mọi ký tự không phải 0–9, chỉ giữ lại các con số.
  // lay gia tri bytes ket thuc, vuot qua dung luong video thi lay gia tri videozise
  const end = Math.min(start + chuckSize, videoSize - 1)

  // Dung luong thuc te cho moi doan video stream
  // Thuong day se la chunkSize, ngoai tru doan cuoi cung
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  /**
   * Format cua header Content-Range: bytes <start>--<end>/<videoSize>
   * Vi du: Content-Range: bytes 1048576-3145727/3145728
   * Yeu cau la `end` phai luon luon nho hon `videoSize`
   * X 'Content-Range': bytes 0-100/100 -> Sai
   * V 'Content-Range': bytes 0-99/100 -> Dung
   *
   * Con Content-Length se la end - start + 1. Dai dien cho khoan cach.
   * De de hinh dung, hay tuong tuong tu so 0 den so 10 thu ta co 11 so
   * byte cung tuong tu, neu start = 0, end = 10 thi ta co 11 byte
   * => cong thu se la end - start + 1
   *
   * chunkSize = 50
   * videoSize = 100
   * |0-----------------50|51---------------99/100(end)
   * stream1: start = 0, end = 50, contentLength = 51
   * stream1: start = 51, end = 99, contentLength = 49
   */
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HttpStatus.PartialContent, headers)
  const videoSteams = createReadStream(videoPath, { start, end })
  videoSteams.pipe(res)
}
export const serveM3u8Controller = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  await sendFileFromS3(res, `videos-hls/${id}/master.m3u8`)
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
  //   if (err) {
  //     res.status((err as any).status).send(err)
  //   }
  // })
}
export const serveSegmentController = async (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params
  await sendFileFromS3(res, `videos-hls/${id}/${v}/${segment}`)
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
  //   if (err) {
  //     res.status((err as any).status).send(err)
  //   }
  // })
}
