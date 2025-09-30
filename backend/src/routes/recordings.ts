import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, checkFileExists } from '../services/s3';
import '../types'; // Импортируем расширения типов

const router = Router();

// Кастомная авторизация для аудиофайлов (поддерживает токен в query параметре)
const authenticateAudio = (req: Request, res: Response, next: Function) => {
  try {
    // Получаем токен из заголовка или query параметра
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ message: 'Токен доступа не предоставлен' });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Недействительный токен' });
  }
};

// OPTIONS обрабатывается в server.ts

// GET /api/recordings/* - возвращает прямую ссылку на S3 файл
router.get('/*', authenticateAudio, async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0]; // Получаем путь после /recordings/
    
    if (!filePath) {
      return res.status(400).json({ 
        error: 'Путь к файлу не указан' 
      });
    }

    console.log(`🎵 Запрос аудиофайла: ${filePath}`);
    console.log(`🔐 Пользователь авторизован: ${req.user ? 'Да' : 'Нет'}`);

    // Пробуем разные варианты пути в S3
    const possibleKeys = [
      filePath, // callcentre/recording_path/файл.mp3
      `f7eead03-crmfiles/${filePath}`, // f7eead03-crmfiles/callcentre/recording_path/файл.mp3
      `recordings/${filePath}`, // recordings/callcentre/recording_path/файл.mp3
    ];
    
    console.log(`🔍 Проверяем пути:`, possibleKeys);
    
    let s3Key = null;

    // Проверяем каждый возможный путь
    for (const key of possibleKeys) {
      const exists = await checkFileExists(key);
      if (exists) {
        s3Key = key;
        break;
      }
    }

    if (!s3Key) {
      return res.status(404).json({ 
        error: 'Аудиофайл не найден в S3'
      });
    }

    console.log(`📁 Найден файл в S3: ${s3Key}`);

    // Обрабатываем Range запросы для аудио
    const range = req.headers.range;
    let getObjectParams: any = {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
    };

    // Если есть Range заголовок, добавляем его в запрос к S3
    if (range) {
      getObjectParams.Range = range;
      console.log(`📊 Range запрос: ${range}`);
    }

    const getObjectCommand = new GetObjectCommand(getObjectParams);
    const s3Response = await s3Client.send(getObjectCommand);
    
    if (!s3Response.Body) {
      return res.status(404).json({ 
        error: 'Файл не найден в S3'
      });
    }

    // Устанавливаем правильные заголовки для аудио
    res.setHeader('Content-Type', s3Response.ContentType || 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Если это partial content (Range запрос)
    if (s3Response.ContentRange) {
      res.status(206); // Partial Content
      res.setHeader('Content-Range', s3Response.ContentRange);
      res.setHeader('Content-Length', s3Response.ContentLength || 0);
    } else {
      res.status(200);
      res.setHeader('Content-Length', s3Response.ContentLength || 0);
    }
    
    console.log(`🎵 Проксируем аудиофайл: ${s3Key} (${s3Response.ContentLength} bytes)`);
    
    // Проксируем поток данных
    const stream = s3Response.Body as NodeJS.ReadableStream;
    
    // Обработка ошибок потока
    stream.on('error', (error) => {
      console.error('❌ Ошибка потока S3:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка чтения файла' });
      }
    });

    res.on('close', () => {
      console.log('🔌 Соединение закрыто клиентом');
      if (stream && typeof (stream as any).destroy === 'function') {
        (stream as any).destroy();
      }
    });

    stream.pipe(res);

  } catch (error: any) {
    console.error('Ошибка при получении аудиофайла:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера при получении аудиофайла'
    });
  }
});

export default router;
