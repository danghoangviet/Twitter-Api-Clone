import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { readFileSync } from 'fs'
import path from 'path'
import { envConfig } from './config'

// Create SES service object.
const sesClient = new SESClient({
  region: envConfig.aws.region,
  credentials: {
    secretAccessKey: envConfig.aws.secretAccessKey,
    accessKeyId: envConfig.aws.accessKeyId
  }
})

const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string
  toAddresses: string | string[]
  ccAddresses?: string | string[]
  body: string
  subject: string
  replyToAddresses?: string | string[]
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  })
}

const sendVerifyEmail = async (toAddress: string, subject: string, body: string) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: envConfig.aws.sesFromAddress,
    toAddresses: toAddress,
    body,
    subject
  })

  return sesClient.send(sendEmailCommand)
}

const verifyEmailTemplate = readFileSync(path.resolve('src/templates/verify-email.html'), 'utf8')

export const sendVerifyEmailTemplate = async (
  toAddress: string,
  email_verify_token: string,
  template: string = verifyEmailTemplate
) => {
  const subject = 'Verify your email address'
  const body = template
    .replace(/{{title}}/g, 'Please verify your email address')
    .replace(/{{content}}/g, 'Click the link below to verify your email address')
    .replace(/{{titleLink}}/g, 'Verify Email')
    .replace(/{{link}}/g, `${envConfig.clientUrl}/verify-email?token=${email_verify_token}`)

  return sendVerifyEmail(toAddress, subject, body)
}

export const sendForgotPasswordEmail = async (
  toAddress: string,
  forgot_password_token: string,
  template: string = verifyEmailTemplate
) => {
  const subject = 'Forgot password'
  const body = template
    .replace(/{{title}}/g, 'Reset your password')
    .replace(/{{content}}/g, 'Click the link below to reset your password')
    .replace(/{{titleLink}}/g, 'Reset Password')
    .replace(/{{link}}/g, `${envConfig.clientUrl}/forgot-password?token=${forgot_password_token}`)

  return sendVerifyEmail(toAddress, subject, body)
}
