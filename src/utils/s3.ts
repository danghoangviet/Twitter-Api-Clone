import { readFileSync } from 'fs'
import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { config } from 'dotenv'
import path from 'path'
import { Response } from 'express'
import { HttpStatus } from '~/constants/enum'
config()

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

// const filePath = path.resolve('upload/images/7facacad39ab9fce0d695cc00.jpg')
export const uploadFileToS3 = async ({
  filePath,
  fileName,
  contentType
}: {
  filePath: string
  fileName: string
  contentType: string
}) => {
  const file = readFileSync(filePath)
  const parallelUploads3 = new Upload({
    client: s3,
    params: { Bucket: process.env.S3_BUCKET_NAME as string, Key: fileName, Body: file, ContentType: contentType },

    // optional tags
    tags: [
      /*...*/
    ],

    // additional optional fields show default values below:

    // (optional) concurrency configuration
    queueSize: 4,

    // (optional) size of each part, in bytes, at least 5MB
    partSize: 1024 * 1024 * 5,

    // (optional) when true, do not automatically call AbortMultipartUpload when
    // a multipart upload fails to complete. You should then manually handle
    // the leftover parts.
    leavePartsOnError: false
  })
  return parallelUploads3.done()
}

export const sendFileFromS3 = async (res: Response, filePath: string) => {
  try {
    const fileStream = await s3.getObject({
      Bucket: process.env.S3_BUCKET_NAME as string,
      Key: filePath
    })
    // res.setHeader('Content-Type', 'video/mp4')
    // res.setHeader('Content-Disposition', 'inline')
    ;(fileStream.Body as any).pipe(res)
  } catch (error) {
    res.status(HttpStatus.NotFound).send('Something went wrong')
  }
}
