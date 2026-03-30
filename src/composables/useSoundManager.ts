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

    // Создаём тихий звук для разблокировки AudioContext в некоторых браузерах
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
  const loadSound = (url: string): HTMLAudioElement => {
    if (soundCache.has(url)) {
      return soundCache.get(url)!
    }

    const audio = new Audio(url)
    audio.preload = 'auto'
    soundCache.set(url, audio)
    return audio
  }

  // Воспроизведение фоновой музыки с петлёй
  const playBackgroundMusic = (type: 'main' | 'tension' | 'victory' | 'fail' = 'main'): void => {
    if (!isAudioEnabled.value || isMuted.value) {
      console.log(`🎵 Музыка не играет (звук выключен или не разрешён)`)
      return
    }

    // Останавливаем текущую музыку
    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
    }

    // Выбираем трек
    const musicUrls = {
      main: '/sounds/music/main-theme.mp3',
      tension: '/sounds/music/tension.mp3',
      victory: '/sounds/music/victory.mp3',
      fail: '/sounds/music/fail.mp3',
    }

    const url = musicUrls[type]
    if (!url) return

    const audio = loadSound(url)
    audio.loop = true
    audio.volume = musicVolume.value
    audio.play().catch((e) => {
      console.log(`Не удалось воспроизвести музыку: ${e}`)
    })

    currentMusic.value = audio
    isMusicPlaying.value = true
    console.log(`🎵 Воспроизведение музыки: ${type}`)
  }

  // Остановка фоновой музыки
  const stopBackgroundMusic = (): void => {
    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
      currentMusic.value = null
      isMusicPlaying.value = false
      console.log('⏹️ Музыка остановлена')
    }
  }

  // Пауза музыки
  const pauseBackgroundMusic = (): void => {
    if (currentMusic.value && isMusicPlaying.value) {
      currentMusic.value.pause()
      isMusicPlaying.value = false
      console.log('⏸️ Музыка на паузе')
    }
  }

  // Продолжить музыку
  const resumeBackgroundMusic = (): void => {
    if (currentMusic.value && !isMusicPlaying.value && !isMuted.value && isAudioEnabled.value) {
      currentMusic.value.play().catch((e) => console.log('Ошибка воспроизведения:', e))
      isMusicPlaying.value = true
      console.log('▶️ Музыка продолжена')
    }
  }

  // Воспроизведение звукового эффекта
  const playEffect = (
    effectName: string,
    options: { volume?: number; fadeOut?: number } = {},
  ): void => {
    if (!isAudioEnabled.value || isMuted.value) return

    // Карта эффектов
    const effectUrls: Record<string, string> = {
      // Основные эффекты
      questionStart: '/sounds/effects/question-start.mp3',
      correct: '/sounds/effects/correct.mp3',
      wrong: '/sounds/effects/wrong.mp3',
      applause: '/sounds/effects/applause.mp3',
      dramaticPause: '/sounds/effects/dramatic-pause.mp3',
      optionSelect: '/sounds/effects/option-select.mp3',
      finalAnswer: '/sounds/effects/final-answer.mp3',

      // Подсказки
      fiftyFifty: '/sounds/hints/fifty-fifty.mp3',
      call: '/sounds/hints/call.mp3',
      audience: '/sounds/hints/audience.mp3',
    }

    const url = effectUrls[effectName]
    if (!url) {
      console.log(`⚠️ Эффект не найден: ${effectName}`)
      return
    }

    // Создаём новый Audio для эффекта (чтобы можно было играть несколько одновременно)
    const audio = new Audio(url)
    audio.volume = options.volume ?? sfxVolume.value

    audio.play().catch((e) => {
      console.log(`Не удалось воспроизвести эффект ${effectName}:`, e)
    })

    // Авто-удаление после воспроизведения
    audio.onended = () => {
      audio.remove()
    }

    console.log(`🔊 Эффект: ${effectName}`)
  }

  // Специальные последовательности

  // Драматический момент (пауза в музыке + эффект)
  const playDramaticMoment = (): void => {
    pauseBackgroundMusic()
    playEffect('dramaticPause', { fadeOut: 2000 })

    setTimeout(() => {
      resumeBackgroundMusic()
    }, 2500)
  }

  // Победная последовательность
  const playVictorySequence = (): void => {
    stopBackgroundMusic()
    playEffect('correct')
    playEffect('applause')

    setTimeout(() => {
      playBackgroundMusic('victory')
    }, 2000)
  }

  // Последовательность поражения
  const playFailSequence = (): void => {
    stopBackgroundMusic()
    playEffect('wrong')

    setTimeout(() => {
      playBackgroundMusic('fail')
    }, 1500)
  }

  // Звук при выборе ответа (с разными вариациями)
  const playOptionSelect = (optionId: string): void => {
    playEffect('optionSelect')
  }

  // Звук финального ответа (перед проверкой)
  const playFinalAnswer = (): void => {
    playEffect('finalAnswer')
    playDramaticMoment()
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
      pauseBackgroundMusic()
      console.log('🔇 Звук выключен')
    } else {
      resumeBackgroundMusic()
      console.log('🔊 Звук включён')
    }

    return isMuted.value
  }

  // Очистка
  const cleanup = (): void => {
    stopBackgroundMusic()
    soundCache.clear()
  }

  return {
    // Состояние
    isMuted: readonly(isMuted),
    musicVolume: readonly(musicVolume),
    sfxVolume: readonly(sfxVolume),
    isAudioEnabled: readonly(isAudioEnabled),
    isMusicPlaying: readonly(isMusicPlaying),

    // Основные методы
    enableAudio,
    playBackgroundMusic,
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    playEffect,

    // Специальные последовательности
    playDramaticMoment,
    playVictorySequence,
    playFailSequence,
    playOptionSelect,
    playFinalAnswer,

    // Управление
    setMusicVolume,
    setSFXVolume,
    toggleMute,
    cleanup,
  }
}
