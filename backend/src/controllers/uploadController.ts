import { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { uploadFileToS3, deleteFileFromS3 } from '../services/s3'

// Настройка multer для загрузки в память (не на диск)
const storage = multer.memoryStorage()

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Разрешены только файлы изображений и PDF файлы'))
    }
  }
})

export const uploadMiddleware = upload.single('document')

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не был загружен' })
    }

    console.log('📤 Загружаем файл в S3:', req.file.originalname)
    
    // Получаем папку из тела запроса или используем папку по умолчанию
    const folder = req.body.folder || 'documents'
    console.log('📁 Папка для загрузки:', folder)
    
    // Загружаем файл в S3
    const uploadResult = await uploadFileToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    )

    console.log('✅ Файл успешно загружен в S3:', uploadResult.url)
    
    res.json({
      message: 'Файл успешно загружен',
      filename: uploadResult.key,
      originalName: uploadResult.originalName,
      size: req.file.size,
      url: uploadResult.url,
      s3Key: uploadResult.key
    })
  } catch (error) {
    console.error('❌ Ошибка загрузки файла в S3:', error)
    res.status(500).json({ 
      message: 'Ошибка загрузки файла', 
      error: error.message 
    })
  }
}

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    
    console.log('🗑️ Удаляем файл из S3:', filename)
    
    // Удаляем файл из S3
    await deleteFileFromS3(filename)
    
    console.log('✅ Файл успешно удален из S3:', filename)
    res.json({ message: 'Файл успешно удален' })
    
  } catch (error) {
    console.error('❌ Ошибка удаления файла из S3:', error)
    res.status(500).json({ 
      message: 'Ошибка удаления файла',
      error: error.message 
    })
  }
}
