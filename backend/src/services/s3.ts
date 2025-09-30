import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Конфигурация S3 клиента для Timeweb
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'ru-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Необходимо для Timeweb S3
})

const BUCKET_NAME = process.env.S3_BUCKET!

export interface UploadResult {
  key: string
  url: string
  originalName: string
}

/**
 * Загрузка файла в S3
 */
export async function uploadFileToS3(
  fileBuffer: Buffer, 
  originalName: string, 
  contentType: string,
  folder: string = 'documents'
): Promise<UploadResult> {
  try {
    // Генерируем уникальное имя файла
    const fileExtension = path.extname(originalName)
    const fileName = `${uuidv4()}${fileExtension}`
    const key = `${folder}/${fileName}`

    // Команда для загрузки файла
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      // Делаем файл публично доступным для чтения
      ACL: 'public-read',
    })

    // Загружаем файл
    await s3Client.send(uploadCommand)

    // Формируем публичный URL
    const publicUrl = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`

    return {
      key,
      url: publicUrl,
      originalName
    }
  } catch (error) {
    console.error('Ошибка загрузки файла в S3:', error)
    throw new Error('Не удалось загрузить файл')
  }
}

/**
 * Удаление файла из S3
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(deleteCommand)
    console.log(`Файл ${key} успешно удален из S3`)
  } catch (error) {
    console.error('Ошибка удаления файла из S3:', error)
    throw new Error('Не удалось удалить файл')
  }
}

/**
 * Получение подписанного URL для приватного доступа к файлу
 */
export async function getSignedUrlForFile(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn })
    return signedUrl
  } catch (error) {
    console.error('Ошибка создания подписанного URL:', error)
    throw new Error('Не удалось создать ссылку на файл')
  }
}

/**
 * Проверка существования файла в S3
 */
export async function checkFileExists(key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    return false
  }
}

export { s3Client, BUCKET_NAME }
