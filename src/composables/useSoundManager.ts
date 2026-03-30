// src/composables/useSoundManager.ts
import { ref, readonly } from 'vue'

export function useSoundManager() {
  // Состояние
  const isMuted = ref(false)
  const musicVolume = ref(0.5)
  const sfxVolume = ref(0.7)
  const isAudioEnabled = ref(false)
  const currentMusic = ref<HTMLAudioElement | null>(null)
  const isMusicPlaying = ref(false)

  // Кэш для загруженных звуков
  const soundCache = new Map<string, HTMLAudioElement>()

  // Включение звука (требуется клик пользователя)
  const enableAudio = (): void => {
    if (isAudioEnabled.value) return

    const silentAudio = new Audio()
    silentAudio.volume = 0
    silentAudio
      .play()
      .then(() => {
        silentAudio.pause()
        console.log('🎵 Аудио разблокировано')
      })
      .catch(() => {
        console.log('Автовоспроизведение заблокировано, нужен клик')
      })

    isAudioEnabled.value = true
  }

  // Загрузка звука
  const loadSound = (url: string): HTMLAudioElement | null => {
    if (soundCache.has(url)) {
      return soundCache.get(url)!
    }

    const audio = new Audio(url)
    audio.preload = 'auto'

    audio.addEventListener('error', (e) => {
      console.warn(`⚠️ Не удалось загрузить звук: ${url}`, e)
    })

    soundCache.set(url, audio)
    return audio
  }

  // Воспроизведение музыки для вопроса (с петлёй)
  const playQuestionMusic = (level: number): void => {
    if (!isAudioEnabled.value || isMuted.value) {
      console.log(`🎵 Музыка не играет (звук выключен или не разрешён)`)
      return
    }

    // Останавливаем текущую музыку
    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
    }

    // Выбираем музыку в зависимости от номера вопроса
    let musicUrl = ''
    let musicName = ''

    if (level === 15) {
      musicUrl = '/sounds/music/final.mp3'
      musicName = 'final (15 вопрос)'
    } else if (level >= 11) {
      musicUrl = '/sounds/music/level-3.mp3'
      musicName = 'level-3 (вопросы 11-14)'
    } else if (level >= 6) {
      musicUrl = '/sounds/music/level-2.mp3'
      musicName = 'level-2 (вопросы 6-10)'
    } else {
      musicUrl = '/sounds/music/level-1.mp3'
      musicName = 'level-1 (вопросы 1-5)'
    }

    const audio = loadSound(musicUrl)
    if (!audio) {
      console.log(`⚠️ Не найден файл музыки: ${musicUrl}`)
      return
    }

    audio.loop = true
    audio.volume = musicVolume.value

    audio.play().catch((e) => {
      console.log(`⚠️ Не удалось воспроизвести музыку:`, e.message)
    })

    currentMusic.value = audio
    isMusicPlaying.value = true
    console.log(`🎵 Музыка для ${musicName}`)
  }

  // Остановка музыки
  const stopMusic = (): void => {
    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
      currentMusic.value = null
      isMusicPlaying.value = false
      console.log('⏹️ Музыка остановлена')
    }
  }

  // Победная музыка
  const playVictoryMusic = (): void => {
    stopMusic()

    if (!isAudioEnabled.value || isMuted.value) return

    const audio = loadSound('/sounds/music/victory.mp3')
    if (!audio) return

    audio.loop = false
    audio.volume = musicVolume.value
    audio.play().catch((e) => console.log('Ошибка:', e))

    currentMusic.value = audio
    console.log('🎵 Победная музыка')
  }

  // Музыка поражения
  const playFailMusic = (): void => {
    stopMusic()

    if (!isAudioEnabled.value || isMuted.value) return

    const audio = loadSound('/sounds/music/fail.mp3')
    if (!audio) return

    audio.loop = false
    audio.volume = musicVolume.value
    audio.play().catch((e) => console.log('Ошибка:', e))

    currentMusic.value = audio
    console.log('🎵 Музыка поражения')
  }

  // Воспроизведение звукового эффекта
  const playEffect = (effectName: string, options: { volume?: number } = {}): void => {
    if (!isAudioEnabled.value || isMuted.value) return

    const effectUrls: Record<string, string> = {
      correct: '/sounds/effects/correct.mp3',
      wrong: '/sounds/effects/wrong.mp3',
      optionSelect: '/sounds/effects/option-select.mp3',
      fiftyFifty: '/sounds/hints/fifty-fifty.mp3',
      call: '/sounds/hints/call.mp3',
      audience: '/sounds/hints/audience.mp3',
    }

    const url = effectUrls[effectName]
    if (!url) {
      console.log(`⚠️ Неизвестный эффект: ${effectName}`)
      return
    }

    const audio = new Audio(url)
    audio.volume = options.volume ?? sfxVolume.value

    audio.play().catch((e) => {
      console.warn(`⚠️ Не удалось воспроизвести эффект ${effectName}: ${e.message}`)
    })

    audio.onended = () => {
      audio.remove()
    }

    console.log(`🔊 Эффект: ${effectName}`)
  }

  // Удобные обёртки для эффектов
  const playOptionSelect = (): void => {
    playEffect('optionSelect')
  }

  const playCorrect = (): void => {
    playEffect('correct')
  }

  const playWrong = (): void => {
    playEffect('wrong')
  }

  const playFiftyFifty = (): void => {
    playEffect('fiftyFifty')
  }

  const playCall = (): void => {
    playEffect('call')
  }

  const playAudience = (): void => {
    playEffect('audience')
  }

  // Управление громкостью
  const setMusicVolume = (volume: number): void => {
    musicVolume.value = Math.max(0, Math.min(1, volume))
    if (currentMusic.value) {
      currentMusic.value.volume = musicVolume.value
    }
  }

  const setSFXVolume = (volume: number): void => {
    sfxVolume.value = Math.max(0, Math.min(1, volume))
  }

  // Mute/Unmute
  const toggleMute = (): boolean => {
    isMuted.value = !isMuted.value

    if (isMuted.value) {
      if (currentMusic.value) {
        currentMusic.value.volume = 0
      }
      console.log('🔇 Звук выключен')
    } else {
      if (currentMusic.value) {
        currentMusic.value.volume = musicVolume.value
      }
      console.log('🔊 Звук включён')
    }

    return isMuted.value
  }

  // Очистка
  const cleanup = (): void => {
    stopMusic()
    soundCache.clear()
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
    playVictoryMusic,
    playFailMusic,
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
  }
}
