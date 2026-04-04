import { ref, readonly } from 'vue'
import { BASE_URL } from '@/config'

// ✅ Глобальное состояние (singleton)
const isMuted = ref(false)
const musicVolume = ref(0.5)
const sfxVolume = ref(0.7)
const isAudioEnabled = ref(false)
const currentMusic = ref<HTMLAudioElement | null>(null)
const isMusicPlaying = ref(false)

const soundCache = new Map<string, HTMLAudioElement>()

// ✅ Хранилище активных эффектов
const activeEffects = new Set<HTMLAudioElement>()

export function useSoundManager() {
  const enableAudio = (): void => {
    if (isAudioEnabled.value) return
    isAudioEnabled.value = true
  }

  const loadSound = (url: string): HTMLAudioElement | null => {
    if (soundCache.has(url)) {
      return soundCache.get(url)!
    }
    const audio = new Audio(url)
    audio.preload = 'auto'
    soundCache.set(url, audio)
    return audio
  }

  const playQuestionMusic = (level: number): void => {
    if (!isAudioEnabled.value || isMuted.value) return

    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
      currentMusic.value = null
    }

    let musicUrl = ''
    let musicName = ''

    if (level === 15) {
      musicUrl = `${BASE_URL}sounds/music/final.mp3`
      musicName = 'final (15 вопрос)'
    } else if (level >= 11) {
      musicUrl = `${BASE_URL}sounds/music/level-3.mp3`
      musicName = 'level-3 (вопросы 11-14)'
    } else if (level >= 6) {
      musicUrl = `${BASE_URL}sounds/music/level-2.mp3`
      musicName = 'level-2 (вопросы 6-10)'
    } else {
      musicUrl = `${BASE_URL}sounds/music/level-1.mp3`
      musicName = 'level-1 (вопросы 1-5)'
    }

    const audio = loadSound(musicUrl)
    if (!audio) return

    audio.loop = false
    audio.volume = musicVolume.value

    audio.play().catch((e) => {
      console.error(`❌ Ошибка воспроизведения музыки вопроса:`, e.message)
    })

    currentMusic.value = audio
    isMusicPlaying.value = true
  }

  const stopMusic = (): void => {
    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
      currentMusic.value = null
      isMusicPlaying.value = false
    }
  }

  // ✅ Остановка всех эффектов
  const stopAllEffects = (): void => {
    activeEffects.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    activeEffects.clear()
  }

  const preloadMusic = (level: number): Promise<void> => {
    return new Promise((resolve) => {
      let musicUrl = ''

      if (level === 15) {
        musicUrl = `${BASE_URL}sounds/music/final.mp3`
      } else if (level >= 11) {
        musicUrl = `${BASE_URL}sounds/music/level-3.mp3`
      } else if (level >= 6) {
        musicUrl = `${BASE_URL}sounds/music/level-2.mp3`
      } else {
        musicUrl = `${BASE_URL}sounds/music/level-1.mp3`
      }

      const audio = loadSound(musicUrl)
      if (!audio) {
        resolve()
        return
      }

      if (audio.readyState >= 2) {
        resolve()
        return
      }

      audio.addEventListener(
        'canplaythrough',
        () => {
          resolve()
        },
        { once: true },
      )

      audio.addEventListener(
        'error',
        () => {
          resolve()
        },
        { once: true },
      )

      setTimeout(() => {
        resolve()
      }, 3000)
    })
  }

  const playQuestionMusicWithPreload = async (level: number): Promise<void> => {
    await preloadMusic(level)
    playQuestionMusic(level)
  }

  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio(url)

      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onLoaded)
        audio.removeEventListener('error', onError)
        audio.src = ''
        audio.load()
      }

      const onLoaded = () => {
        const duration = audio.duration * 1000
        cleanup()
        resolve(duration)
      }

      const onError = () => {
        cleanup()
        resolve(0)
      }

      audio.addEventListener('loadedmetadata', onLoaded)
      audio.addEventListener('error', onError)
      audio.src = url
      audio.load()
    })
  }

  const playVictoryMusic = (difficulty: number, questionNumber: number): void => {
    if (!isAudioEnabled.value || isMuted.value) return

    let musicUrl = ''
    let musicName = ''

    if (questionNumber === 15) {
      musicUrl = `${BASE_URL}sounds/effects/victory-final.mp3`
      musicName = 'victory-final'
    } else if (questionNumber === 5 || questionNumber === 10) {
      musicUrl = `${BASE_URL}sounds/effects/victory-milestone.mp3`
      musicName = 'victory-milestone'
    } else {
      musicUrl = `${BASE_URL}sounds/effects/victory.mp3`
      musicName = 'victory'
    }

    const audio = new Audio(musicUrl)
    audio.volume = sfxVolume.value

    activeEffects.add(audio)

    audio.play().catch((e) => {
      console.error(`❌ Ошибка воспроизведения победы (${musicName}):`, e.message)
    })

    audio.onended = () => {
      activeEffects.delete(audio)
      audio.remove()
    }
  }

  const playFailMusic = (isFinalQuestion: boolean): void => {
    if (!isAudioEnabled.value || isMuted.value) return

    const musicUrl = isFinalQuestion
      ? `${BASE_URL}sounds/effects/fail-final.mp3`
      : `${BASE_URL}sounds/effects/fail.mp3`
    const musicName = isFinalQuestion ? 'fail-final' : 'fail'

    const audio = new Audio(musicUrl)
    audio.volume = sfxVolume.value

    activeEffects.add(audio)

    audio.play().catch((e) => {
      console.error(`❌ Ошибка воспроизведения поражения (${musicName}):`, e.message)
    })

    audio.onended = () => {
      activeEffects.delete(audio)
      audio.remove()
    }
  }

  const playGameOverMusic = (): void => {
    stopMusic()
    stopAllEffects()

    if (!isAudioEnabled.value || isMuted.value) return

    const audio = loadSound(`${BASE_URL}sounds/music/game-over.mp3`)
    if (!audio) return

    audio.loop = false
    audio.volume = musicVolume.value

    audio.play().catch((e) => {
      console.error(`❌ Ошибка воспроизведения Game Over музыки:`, e.message)
    })

    currentMusic.value = audio
  }

  const playEffect = (effectName: string): void => {
    if (!isAudioEnabled.value || isMuted.value) return

    const effectUrls: Record<string, string> = {
      correct: `${BASE_URL}sounds/effects/correct.mp3`,
      wrong: `${BASE_URL}sounds/effects/wrong.mp3`,
      optionSelect: `${BASE_URL}sounds/effects/option-select.mp3`,
      fiftyFifty: `${BASE_URL}sounds/hints/fifty-fifty.mp3`,
      call: `${BASE_URL}sounds/hints/call.mp3`,
      audience: `${BASE_URL}sounds/hints/audience.mp3`,
    }

    const url = effectUrls[effectName]
    if (!url) return

    const audio = new Audio(url)
    audio.volume = sfxVolume.value

    activeEffects.add(audio)

    audio.play().catch((e) => {
      console.error(`❌ Ошибка воспроизведения эффекта ${effectName}:`, e.message)
    })

    audio.onended = () => {
      activeEffects.delete(audio)
      audio.remove()
    }
  }

  const playOptionSelect = (): void => playEffect('optionSelect')
  const playCorrect = (): void => playEffect('correct')
  const playWrong = (): void => playEffect('wrong')
  const playFiftyFifty = (): void => playEffect('fiftyFifty')
  const playCall = (): void => playEffect('call')
  const playAudience = (): void => playEffect('audience')

  const setMusicVolume = (volume: number): void => {
    musicVolume.value = volume
    if (currentMusic.value) {
      currentMusic.value.volume = volume
    }
  }

  const setSFXVolume = (volume: number): void => {
    sfxVolume.value = volume
  }

  const toggleMute = (): boolean => {
    isMuted.value = !isMuted.value

    if (isMuted.value) {
      if (currentMusic.value) currentMusic.value.volume = 0
      activeEffects.forEach((audio) => (audio.volume = 0))
    } else {
      if (currentMusic.value) currentMusic.value.volume = musicVolume.value
      activeEffects.forEach((audio) => (audio.volume = sfxVolume.value))
    }

    return isMuted.value
  }

  const cleanup = (): void => {
    stopMusic()
    stopAllEffects()
    soundCache.clear()
  }

  const preloadAllMusic = async (): Promise<void> => {
    const musicUrls = [
      `${BASE_URL}sounds/music/waiting.mp3`,
      `${BASE_URL}sounds/music/level-1.mp3`,
      `${BASE_URL}sounds/music/level-2.mp3`,
      `${BASE_URL}sounds/music/level-3.mp3`,
      `${BASE_URL}sounds/music/final.mp3`,
      `${BASE_URL}sounds/music/game-over.mp3`,
    ]

    console.log('🎵 Предзагрузка музыки...')

    const promises = musicUrls.map((url) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.src = url
        audio.load()
        // Не ждём полной загрузки, достаточно начала
        audio.addEventListener('canplaythrough', () => resolve(), { once: true })
        setTimeout(() => resolve(), 3000) // таймаут на всякий случай
      })
    })

    await Promise.all(promises)
    console.log('🎵 Музыка предзагружена')
  }

  const playWaitingMusic = (): void => {
    if (!isAudioEnabled.value || isMuted.value) return

    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
      currentMusic.value = null
    }

    const musicUrl = `${BASE_URL}sounds/music/waiting.mp3`
    const audio = loadSound(musicUrl)
    if (!audio) {
      console.warn(`⚠️ Не найден файл музыки ожидания: ${musicUrl}`)
      return
    }

    audio.loop = true // зацикливаем, пока ждём
    audio.volume = musicVolume.value

    audio.play().catch((e) => {
      console.error(`❌ Ошибка воспроизведения музыки ожидания:`, e.message)
    })

    currentMusic.value = audio
    isMusicPlaying.value = true
    console.log('🎵 Музыка ожидания (экран "Вперёд")')
  }

  // Добавляем метод для остановки музыки ожидания и запуска музыки вопроса
  const stopWaitingAndStartQuestionMusic = async (level: number): Promise<void> => {
    stopMusic()
    await playQuestionMusicWithPreload(level)
  }

  return {
    isMuted: readonly(isMuted),
    musicVolume: readonly(musicVolume),
    sfxVolume: readonly(sfxVolume),
    isAudioEnabled: readonly(isAudioEnabled),
    isMusicPlaying: readonly(isMusicPlaying),

    enableAudio,
    playQuestionMusic,
    stopMusic,
    stopAllEffects,
    playVictoryMusic,
    playFailMusic,
    playGameOverMusic,
    playOptionSelect,
    playCorrect,
    playWrong,
    playFiftyFifty,
    playCall,
    playAudience,
    setMusicVolume,
    setSFXVolume,
    toggleMute,
    cleanup,
    getAudioDuration,
    preloadMusic,
    playQuestionMusicWithPreload,
    preloadAllMusic,
    playWaitingMusic,
    stopWaitingAndStartQuestionMusic,
  }
}
