// src/composables/useSoundManager.ts
import { ref, readonly } from 'vue'

export function useSoundManager() {
  const isMuted = ref(false)
  const musicVolume = ref(0.5)
  const sfxVolume = ref(0.7)
  const isAudioEnabled = ref(false)
  const currentMusic = ref<HTMLAudioElement | null>(null)
  const isMusicPlaying = ref(false)

  const soundCache = new Map<string, HTMLAudioElement>()

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
    console.log(
      `🎵 playQuestionMusic, isAudioEnabled: ${isAudioEnabled.value}, isMuted: ${isMuted.value}`,
    )

    if (!isAudioEnabled.value || isMuted.value) return

    // Принудительно останавливаем любую текущую музыку
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

    audio
      .play()
      .then(() => {
        console.log('🎵 Музыка играет')
      })
      .catch((e) => console.log('Музыка не играет:', e))

    currentMusic.value = audio
    isMusicPlaying.value = true
  }

  // Принудительная остановка музыки
  const stopMusic = (): void => {
    if (currentMusic.value) {
      const audio = currentMusic.value
      audio.pause()
      audio.currentTime = 0
      currentMusic.value = null
      isMusicPlaying.value = false
      console.log('⏹️ Музыка принудительно остановлена')
    }
  }

  const playVictoryMusic = (): void => {
    stopMusic()
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
    if (!isAudioEnabled.value || isMuted.value) return
    const audio = loadSound('/sounds/music/fail.mp3')
    if (!audio) return
    audio.loop = false
    audio.volume = musicVolume.value
    audio.play().catch(() => {})
    currentMusic.value = audio
  }

  const playEffect = (effectName: string): void => {
    console.log(
      `🔊 playEffect: ${effectName}, isAudioEnabled: ${isAudioEnabled.value}, isMuted: ${isMuted.value}`,
    )

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

    audio
      .play()
      .then(() => {
        console.log(`✅ Эффект ${effectName} воспроизведён`)
      })
      .catch((e) => console.log(`Эффект ${effectName} не играет:`, e))

    audio.onended = () => audio.remove()
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
    console.log('🔊 toggleMute, isMuted:', isMuted.value)

    if (isMuted.value && currentMusic.value) {
      currentMusic.value.volume = 0
    } else if (!isMuted.value && currentMusic.value) {
      currentMusic.value.volume = musicVolume.value
      // Если музыка была остановлена, но mute выключили — не перезапускаем
    }
    return isMuted.value
  }

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
