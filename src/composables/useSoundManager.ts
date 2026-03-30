// src/composables/useSoundManager.ts
import { ref, readonly } from 'vue'

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
    console.log('✅ Звук включён')
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

    // Остановить текущую музыку
    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
      currentMusic.value = null
    }

    let musicUrl = ''
    if (level === 15) {
      musicUrl = '/sounds/music/final.mp3'
    } else if (level >= 11) {
      musicUrl = '/sounds/music/level-3.mp3'
    } else if (level >= 6) {
      musicUrl = '/sounds/music/level-2.mp3'
    } else {
      musicUrl = '/sounds/music/level-1.mp3'
    }

    const audio = loadSound(musicUrl)
    if (!audio) return

    audio.loop = false
    audio.volume = musicVolume.value

    audio.play().catch(() => {})

    currentMusic.value = audio
    isMusicPlaying.value = true
  }

  const stopMusic = (): void => {
    if (currentMusic.value) {
      currentMusic.value.pause()
      currentMusic.value.currentTime = 0
      currentMusic.value = null
      isMusicPlaying.value = false
      console.log('⏹️ Музыка остановлена')
    }
  }

  // ✅ Остановка всех эффектов
  const stopAllEffects = (): void => {
    activeEffects.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    activeEffects.clear()
    console.log('⏹️ Все эффекты остановлены')
  }

  const playVictoryMusic = (): void => {
    stopMusic()
    stopAllEffects()

    if (!isAudioEnabled.value || isMuted.value) return

    const audio = loadSound('/sounds/music/victory.mp3')
    if (!audio) return

    audio.loop = false
    audio.volume = musicVolume.value
    audio.play().catch(() => {})

    currentMusic.value = audio
  }

  const playFailMusic = (): void => {
    stopMusic()
    stopAllEffects()

    if (!isAudioEnabled.value || isMuted.value) return

    const audio = loadSound('/sounds/music/fail.mp3')
    if (!audio) return

    audio.loop = false
    audio.volume = musicVolume.value
    audio.play().catch(() => {})

    currentMusic.value = audio
  }

  const playEffect = (effectName: string): void => {
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
    if (!url) return

    const audio = new Audio(url)
    audio.volume = sfxVolume.value

    activeEffects.add(audio)

    audio.play().catch(() => {})

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
