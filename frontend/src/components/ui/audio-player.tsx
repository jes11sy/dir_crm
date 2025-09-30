"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Download,
  Loader2
} from "lucide-react"
import { devLog, devError } from "@/lib/config"

interface AudioPlayerProps {
  src: string
  title?: string
  onError?: (error: string) => void
  onLoadStart?: () => void
  onLoadEnd?: () => void
  className?: string
}

export function AudioPlayer({ 
  src, 
  title = "Аудиозапись", 
  onError, 
  onLoadStart, 
  onLoadEnd,
  className = ""
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  // Загрузка аудио через fetch
  useEffect(() => {
    let mounted = true

    const loadAudio = async () => {
      if (!src) return

      setIsLoading(true)
      onLoadStart?.()

      try {
        const token = localStorage.getItem('token')
        
        const response = await fetch(src, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'audio/*'
          },
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const audioBlob = await response.blob()
        
        if (!mounted) return

        const url = URL.createObjectURL(audioBlob)
        setBlobUrl(url)

        if (audioRef.current) {
          audioRef.current.src = url
        }

      } catch (error) {
        devError('Ошибка загрузки аудио:', error)
        onError?.(error instanceof Error ? error.message : 'Неизвестная ошибка')
      } finally {
        if (mounted) {
          setIsLoading(false)
          onLoadEnd?.()
        }
      }
    }

    loadAudio()

    return () => {
      mounted = false
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [src])

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  // Обработчики событий аудио
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      onError?.('Ошибка воспроизведения аудио')
      setIsPlaying(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [blobUrl, onError])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || isLoading) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      devError('Ошибка воспроизведения:', error)
      onError?.('Не удалось воспроизвести аудио')
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume > 0 ? volume : 0.5
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, audio.currentTime - 10)
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.min(duration, audio.currentTime + 10)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const downloadAudio = () => {
    if (blobUrl) {
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${title}.mp3`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm ${className}`}>
      <audio ref={audioRef} preload="metadata" />
      
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={downloadAudio}
          disabled={!blobUrl}
          className="flex items-center gap-2"
        >
          <Download className="w-3 h-3" />
          Скачать
        </Button>
      </div>

      {/* Прогресс бар */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          disabled={!blobUrl || isLoading}
          className="w-full audio-slider cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Контролы */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={skipBackward}
            disabled={!blobUrl || isLoading}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            onClick={togglePlay}
            disabled={!blobUrl || isLoading}
            className="w-10 h-10 rounded-full"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={skipForward}
            disabled={!blobUrl || isLoading}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Громкость */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
            disabled={!blobUrl}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            disabled={!blobUrl}
            className="w-20 volume-slider cursor-pointer"
          />
        </div>
      </div>

    </div>
  )
}
