import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import cron from 'node-cron'

const execAsync = promisify(exec)
const prisma = new PrismaClient()

interface BackupConfig {
  databaseUrl: string
  backupDir: string
  retentionDays: number
  compressionEnabled: boolean
  encryptionEnabled: boolean
  encryptionKey?: string
}

interface BackupResult {
  success: boolean
  filename: string
  size: number
  timestamp: Date
  error?: string
}

const defaultConfig: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  compressionEnabled: true,
  encryptionEnabled: false
}

export class BackupManager {
  private config: BackupConfig

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  async createBackup(): Promise<BackupResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `backup_${timestamp}.sql`
      const filepath = path.join(this.config.backupDir, filename)

      // Создаем директорию если не существует
      await fs.mkdir(this.config.backupDir, { recursive: true })

      // Создаем дамп базы данных
      const dumpCommand = this.buildDumpCommand(filepath)
      await execAsync(dumpCommand)

      // Сжимаем если нужно
      let finalFilename = filename
      let finalFilepath = filepath
      
      if (this.config.compressionEnabled) {
        const compressedFilename = filename.replace('.sql', '.sql.gz')
        const compressedFilepath = path.join(this.config.backupDir, compressedFilename)
        
        await execAsync(`gzip -c "${filepath}" > "${compressedFilepath}"`)
        await fs.unlink(filepath) // Удаляем несжатый файл
        
        finalFilename = compressedFilename
        finalFilepath = compressedFilepath
      }

      // Шифруем если нужно
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        const encryptedFilename = finalFilename + '.enc'
        const encryptedFilepath = path.join(this.config.backupDir, encryptedFilename)
        
        await this.encryptFile(finalFilepath, encryptedFilepath)
        await fs.unlink(finalFilepath) // Удаляем незашифрованный файл
        
        finalFilename = encryptedFilename
        finalFilepath = encryptedFilepath
      }

      // Получаем размер файла
      const stats = await fs.stat(finalFilepath)
      const size = stats.size

      // Сохраняем информацию о бэкапе в базу
      await this.saveBackupRecord(finalFilename, size)

      return {
        success: true,
        filename: finalFilename,
        size,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Backup creation failed:', error)
      return {
        success: false,
        filename: '',
        size: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private buildDumpCommand(filepath: string): string {
    const { databaseUrl } = this.config
    
    // Парсим URL базы данных
    const url = new URL(databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password

    // Формируем команду pg_dump
    const env = {
      PGPASSWORD: password
    }

    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f "${filepath}"`
    
    return command
  }

  private async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not provided')
    }

    const command = `openssl enc -aes-256-cbc -salt -in "${inputPath}" -out "${outputPath}" -k "${this.config.encryptionKey}"`
    await execAsync(command)
  }

  private async decryptFile(inputPath: string, outputPath: string): Promise<void> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not provided')
    }

    const command = `openssl enc -aes-256-cbc -d -in "${inputPath}" -out "${outputPath}" -k "${this.config.encryptionKey}"`
    await execAsync(command)
  }

  private async saveBackupRecord(filename: string, size: number): Promise<void> {
    try {
      // Здесь можно сохранить информацию о бэкапе в базу данных
      console.log(`Backup created: ${filename} (${size} bytes)`)
    } catch (error) {
      console.error('Failed to save backup record:', error)
    }
  }

  async restoreBackup(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.config.backupDir, filename)
      
      // Проверяем существование файла
      await fs.access(filepath)

      let restoreFilepath = filepath

      // Расшифровываем если нужно
      if (filename.endsWith('.enc')) {
        const decryptedFilepath = filepath.replace('.enc', '')
        await this.decryptFile(filepath, decryptedFilepath)
        restoreFilepath = decryptedFilepath
      }

      // Распаковываем если нужно
      if (filename.endsWith('.gz')) {
        const uncompressedFilepath = restoreFilepath.replace('.gz', '')
        await execAsync(`gunzip -c "${restoreFilepath}" > "${uncompressedFilepath}"`)
        restoreFilepath = uncompressedFilepath
      }

      // Восстанавливаем базу данных
      const restoreCommand = this.buildRestoreCommand(restoreFilepath)
      await execAsync(restoreCommand)

      // Очищаем временные файлы
      if (restoreFilepath !== filepath) {
        await fs.unlink(restoreFilepath)
      }

      return true
    } catch (error) {
      console.error('Backup restore failed:', error)
      return false
    }
  }

  private buildRestoreCommand(filepath: string): string {
    const { databaseUrl } = this.config
    
    const url = new URL(databaseUrl)
    const host = url.hostname
    const port = url.port || '5432'
    const database = url.pathname.slice(1)
    const username = url.username
    const password = url.password

    const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${filepath}"`
    
    return command
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.backupDir)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

      for (const file of files) {
        if (file.startsWith('backup_')) {
          const filepath = path.join(this.config.backupDir, file)
          const stats = await fs.stat(filepath)
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filepath)
            console.log(`Deleted old backup: ${file}`)
          }
        }
      }
    } catch (error) {
      console.error('Backup cleanup failed:', error)
    }
  }

  async listBackups(): Promise<Array<{ filename: string; size: number; date: Date }>> {
    try {
      const files = await fs.readdir(this.config.backupDir)
      const backups = []

      for (const file of files) {
        if (file.startsWith('backup_')) {
          const filepath = path.join(this.config.backupDir, file)
          const stats = await fs.stat(filepath)
          
          backups.push({
            filename: file,
            size: stats.size,
            date: stats.mtime
          })
        }
      }

      return backups.sort((a, b) => b.date.getTime() - a.date.getTime())
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }
}

// Создаем экземпляр менеджера бэкапов
export const backupManager = new BackupManager()

// Настраиваем автоматические бэкапы
export function setupAutomaticBackups(): void {
  // Ежедневный бэкап в 2:00
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting scheduled backup...')
    const result = await backupManager.createBackup()
    if (result.success) {
      console.log(`Scheduled backup completed: ${result.filename}`)
    } else {
      console.error(`Scheduled backup failed: ${result.error}`)
    }
  })

  // Очистка старых бэкапов каждую неделю
  cron.schedule('0 3 * * 0', async () => {
    console.log('Starting backup cleanup...')
    await backupManager.cleanupOldBackups()
    console.log('Backup cleanup completed')
  })
}

// API endpoints для управления бэкапами
export async function createBackupEndpoint(req: any, res: any): Promise<void> {
  try {
    const result = await backupManager.createBackup()
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        backup: {
          filename: result.filename,
          size: result.size,
          timestamp: result.timestamp
        }
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup creation failed',
        error: result.error
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Backup creation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function listBackupsEndpoint(req: any, res: any): Promise<void> {
  try {
    const backups = await backupManager.listBackups()
    res.json({
      success: true,
      backups
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function restoreBackupEndpoint(req: any, res: any): Promise<void> {
  try {
    const { filename } = req.params
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      })
    }

    const success = await backupManager.restoreBackup(filename)
    
    if (success) {
      res.json({
        success: true,
        message: 'Backup restored successfully'
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup restore failed'
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Backup restore failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
