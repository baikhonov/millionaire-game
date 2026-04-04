import { ref, computed, readonly } from 'vue'
import { useQuestions } from './useQuestions'
import { useSoundManager } from './useSoundManager'
import type { Option, UsedHints } from '@/types/game'

// Настройки задержек
const DELAYS = {
  REVEAL_ANSWER: 1500,
  NEXT_QUESTION: 1200,
  FIRST_OPTION: 1200,
  OPTION_INTERVAL: 1000,
  MILESTONE_EXTRA_DELAY: 2000,
  FINAL_FAIL_EXTRA_DELAY: 3000,
}

export function useGameLogic() {
  const {
    getQuestion,
    totalQuestions,
    isLastQuestion,
    startNewGame,
    getQuestionsStats,
    resetAllProgress,
    allSetsUsed,
    currentSetName,
    markAllSetsUsed,
  } = useQuestions()

  const soundManager = useSoundManager()

  // ========== Состояние игры ==========
  const currentQuestionIndex = ref<number>(0)
  const currentWinnings = ref<number>(0)
  const selectedOption = ref<Option | null>(null)
  const isAnswered = ref<boolean>(false)
  const isAnswerRevealed = ref<boolean>(false)
  const isWaitingForReveal = ref<boolean>(false)
  const gameEnded = ref<boolean>(false)
  const gameResult = ref<string | null>(null)
  const finalWinnings = ref<number>(0)
  const isLoading = ref<boolean>(true)
  const isCheckingAnswer = ref<boolean>(false)

  // ========== Подсказки ==========
  const usedHints = ref({
    fiftyFifty: false,
    call: false,
    audience: false,
  })

  // Для 50:50 — храним скрытые варианты
  const hiddenOptions = ref<string[]>([])

  // ========== Появление вариантов ==========
  const optionsRevealed = ref<string[]>([])
  const isRevealingOptions = ref(false)
  let revealTimer: number | null = null
  let currentRevealIndex = 0
  const revealOrder = ref<('A' | 'B' | 'C' | 'D')[]>(['A', 'B', 'C', 'D'])

  // ========== Таблица выигрышей ==========
  const prizeLevels: number[] = [
    100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000,
    1000000,
  ]

  // ========== Вычисляемые свойства ==========
  const currentQuestion = computed(() => getQuestion(currentQuestionIndex.value))
  const questionNumber = computed(() => currentQuestionIndex.value + 1)

  const progress = computed(() => {
    if (totalQuestions() === 0) return 0
    return (questionNumber.value / totalQuestions()) * 100
  })

  const allOptionsRevealed = computed(() => optionsRevealed.value.length === 4)

  const formatMoney = (amount: number, currency = 'бачатакоинов'): string => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ' + currency
  }

  // ========== Музыка ==========
  const startQuestionMusic = async (): Promise<void> => {
    if (
      currentQuestion.value?.media?.type === 'audio' ||
      currentQuestion.value?.media?.type === 'video'
    ) {
      return
    }
    const level = questionNumber.value
    await soundManager.playQuestionMusicWithPreload(level)
  }

  // ========== Управление появлением вариантов ==========
  const revealNextOption = (): void => {
    if (currentRevealIndex >= revealOrder.value.length) {
      isRevealingOptions.value = false
      currentRevealIndex = 0
      return
    }

    const optionId = revealOrder.value[currentRevealIndex]
    optionsRevealed.value.push(optionId)
    currentRevealIndex++

    if (currentRevealIndex < revealOrder.value.length) {
      revealTimer = window.setTimeout(() => {
        revealNextOption()
      }, DELAYS.OPTION_INTERVAL)
    } else {
      setTimeout(() => {
        isRevealingOptions.value = false
        currentRevealIndex = 0
      }, 300)
    }
  }

  const startRevealOptions = (): void => {
    if (isRevealingOptions.value) return
    isRevealingOptions.value = true
    optionsRevealed.value = []
    currentRevealIndex = 0

    revealTimer = window.setTimeout(() => {
      revealNextOption()
    }, DELAYS.FIRST_OPTION)
  }

  const resetOptionsReveal = (): void => {
    if (revealTimer) {
      clearTimeout(revealTimer)
      revealTimer = null
    }
    optionsRevealed.value = []
    isRevealingOptions.value = false
    currentRevealIndex = 0
  }

  const isOptionRevealed = (optionId: string): boolean => {
    return optionsRevealed.value.includes(optionId)
  }

  // ========== Логика игры ==========
  const initGame = async (): Promise<void> => {
    isLoading.value = true
    resetGame()
    isLoading.value = false
  }

  const resetGame = (): void => {
    currentQuestionIndex.value = 0
    currentWinnings.value = 0
    selectedOption.value = null
    isAnswered.value = false
    isAnswerRevealed.value = false
    isWaitingForReveal.value = false
    gameEnded.value = false
    gameResult.value = null
    finalWinnings.value = 0
    isCheckingAnswer.value = false

    usedHints.value = {
      fiftyFifty: false,
      call: false,
      audience: false,
    }

    hiddenOptions.value = []
    resetOptionsReveal()
  }

  const stopAllMedia = () => {
    document.querySelectorAll('audio, video').forEach((media) => {
      media.pause()
      media.currentTime = 0
    })
  }

  const selectAnswer = (option: Option): void => {
    if (isAnswered.value || isAnswerRevealed.value || gameEnded.value) return

    stopAllMedia()

    selectedOption.value = option
    isWaitingForReveal.value = true

    soundManager.stopMusic()
    soundManager.stopAllEffects()
    soundManager.playOptionSelect()
  }

  const revealAnswer = (): void => {
    if (!isWaitingForReveal.value || isAnswerRevealed.value) return

    stopAllMedia()

    soundManager.stopAllEffects()
    isAnswerRevealed.value = true

    const isCorrect = selectedOption.value?.isCorrect || false
    const isFinalQuestion = isLastQuestion(currentQuestionIndex.value)
    const difficulty = currentQuestion.value?.difficulty || 1

    if (isCorrect) {
      soundManager.playVictoryMusic(difficulty, currentQuestionIndex.value + 1)
    } else {
      soundManager.playFailMusic(isFinalQuestion)
    }

    setTimeout(() => {
      if (isCorrect) {
        handleCorrectAnswer()
      } else {
        handleWrongAnswer()
      }
    }, DELAYS.REVEAL_ANSWER)
  }

  const handleCorrectAnswer = async (): Promise<void> => {
    currentWinnings.value = prizeLevels[currentQuestionIndex.value]

    if (isLastQuestion(currentQuestionIndex.value)) {
      gameResult.value = 'ПОБЕДА! Вы стали миллионером!'
      finalWinnings.value = 1000000
      gameEnded.value = true
      markAllSetsUsed()
    } else {
      const isMilestone = currentQuestionIndex.value === 4 || currentQuestionIndex.value === 9

      if (isMilestone) {
        const milestoneUrl = `${import.meta.env.BASE_URL}sounds/effects/victory-milestone.mp3`
        const duration = await soundManager.getAudioDuration(milestoneUrl)
        const extraDelay = duration > 0 ? duration + 200 : DELAYS.MILESTONE_EXTRA_DELAY

        setTimeout(async () => {
          await nextQuestion()
        }, extraDelay)
      } else {
        setTimeout(async () => {
          await nextQuestion()
        }, DELAYS.NEXT_QUESTION)
      }
    }
  }

  const nextQuestion = async (): Promise<void> => {
    currentQuestionIndex.value++
    selectedOption.value = null
    isAnswered.value = false
    isAnswerRevealed.value = false
    isWaitingForReveal.value = false

    resetOptionsReveal()
    hiddenOptions.value = []

    await startQuestionMusic()

    setTimeout(() => {
      startRevealOptions()
    }, 500)
  }

  const handleWrongAnswer = async (): Promise<void> => {
    if (currentQuestionIndex.value >= 10) {
      finalWinnings.value = prizeLevels[9]
    } else if (currentQuestionIndex.value >= 5) {
      finalWinnings.value = prizeLevels[4]
    } else {
      finalWinnings.value = 0
    }

    const isFinalQuestion = isLastQuestion(currentQuestionIndex.value)

    if (isFinalQuestion) {
      const failFinalUrl = `${import.meta.env.BASE_URL}sounds/effects/fail-final.mp3`
      const duration = await soundManager.getAudioDuration(failFinalUrl)
      const extraDelay = duration > 0 ? duration + 200 : DELAYS.FINAL_FAIL_EXTRA_DELAY

      setTimeout(() => {
        gameResult.value = `К сожалению, вы ошиблись!`
        gameEnded.value = true
        soundManager.playGameOverMusic()
        markAllSetsUsed()
      }, extraDelay)
    } else {
      setTimeout(() => {
        gameResult.value = `К сожалению, вы ошиблись!`
        gameEnded.value = true
        soundManager.playGameOverMusic()
        markAllSetsUsed()
      }, DELAYS.NEXT_QUESTION)
    }
  }

  const useFiftyFifty = (): void => {
    if (usedHints.value.fiftyFifty || isAnswered.value || isAnswerRevealed.value) return

    usedHints.value.fiftyFifty = true
    soundManager.playFiftyFifty()

    const allOptions = currentQuestion.value?.options || []
    const incorrectOptions = allOptions.filter((opt) => !opt.isCorrect)
    const toHide = incorrectOptions.slice(0, 2).map((opt) => opt.id)

    hiddenOptions.value = toHide
  }

  const useCallHint = (): void => {
    if (usedHints.value.call || isAnswered.value || isAnswerRevealed.value) return

    usedHints.value.call = true
    soundManager.stopMusic()
    soundManager.stopAllEffects()
    soundManager.playCall()
  }

  const useAudienceHint = (): void => {
    if (usedHints.value.audience || isAnswered.value || isAnswerRevealed.value) return

    usedHints.value.audience = true
    soundManager.stopMusic()
    soundManager.stopAllEffects()
    soundManager.playAudience()
  }

  const takeMoney = (): void => {
    finalWinnings.value = currentWinnings.value
    gameResult.value = `Вы решили забрать деньги!`
    gameEnded.value = true
    soundManager.stopMusic()
    soundManager.stopAllEffects()
    soundManager.playGameOverMusic()
  }

  // ========== Возвращаемое API ==========
  return {
    currentQuestionIndex: readonly(currentQuestionIndex),
    currentWinnings: readonly(currentWinnings),
    selectedOption: readonly(selectedOption),
    isAnswered: readonly(isAnswered),
    isAnswerRevealed: readonly(isAnswerRevealed),
    isWaitingForReveal: readonly(isWaitingForReveal),
    gameEnded: readonly(gameEnded),
    gameResult: readonly(gameResult),
    finalWinnings: readonly(finalWinnings),
    usedHints: readonly(usedHints),
    hiddenOptions: readonly(hiddenOptions),
    isLoading: readonly(isLoading),
    isCheckingAnswer: readonly(isCheckingAnswer),
    questionNumber: readonly(questionNumber),

    optionsRevealed: readonly(optionsRevealed),
    isRevealingOptions: readonly(isRevealingOptions),
    allOptionsRevealed: readonly(allOptionsRevealed),
    isOptionRevealed,
    startRevealOptions,

    currentQuestion,
    progress,
    prizeLevels,

    formatMoney,
    initGame,
    resetGame,
    selectAnswer,
    revealAnswer,
    useFiftyFifty,
    useCallHint,
    useAudienceHint,
    takeMoney,

    startNewGame,
    getQuestionsStats,
    resetAllProgress,
    allSetsUsed,
    currentSetName,
    totalQuestions,
    markAllSetsUsed,
  }
}
