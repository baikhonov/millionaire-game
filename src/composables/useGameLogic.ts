// src/composables/useGameLogic.ts
import { ref, computed, readonly } from 'vue'
import { useQuestions } from './useQuestions'
import { useSoundManager } from './useSoundManager'
import type { Option, UsedHints } from '@/types/game'

export function useGameLogic() {
  const { questions, loadQuestions, getQuestion, totalQuestions, isLastQuestion } = useQuestions()
  const soundManager = useSoundManager()

  // Состояние игры
  const currentQuestionIndex = ref<number>(0)
  const currentWinnings = ref<number>(0)
  const selectedOption = ref<Option | null>(null)
  const isAnswered = ref<boolean>(false) // ответ выбран
  const isAnswerRevealed = ref<boolean>(false) // правильный ответ показан
  const gameEnded = ref<boolean>(false)
  const gameResult = ref<string | null>(null)
  const finalWinnings = ref<number>(0)
  const isLoading = ref<boolean>(true)
  const isWaitingForReveal = ref<boolean>(false) // ждём показа правильного ответа

  // Использованные подсказки
  const usedHints = ref<UsedHints>({
    fiftyFifty: false,
    call: false,
    audience: false,
  })

  // Таблица выигрышей
  const prizeLevels: number[] = [
    100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000,
    1000000,
  ]

  // Текущий вопрос
  const currentQuestion = computed(() => getQuestion(currentQuestionIndex.value))
  const questionNumber = computed(() => currentQuestionIndex.value + 1)
  const progress = computed(() => {
    if (totalQuestions() === 0) return 0
    return (questionNumber.value / totalQuestions()) * 100
  })

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽'
  }

  // Инициализация игры
  const initGame = async (): Promise<void> => {
    isLoading.value = true
    await loadQuestions()
    resetGame()
    isLoading.value = false
  }

  // Сброс игры
  const resetGame = (): void => {
    currentQuestionIndex.value = 0
    currentWinnings.value = 0
    selectedOption.value = null
    isAnswered.value = false
    isAnswerRevealed.value = false
    gameEnded.value = false
    gameResult.value = null
    finalWinnings.value = 0
    isWaitingForReveal.value = false
    usedHints.value = {
      fiftyFifty: false,
      call: false,
      audience: false,
    }
  }

  // Выбор ответа
  const selectAnswer = (option: Option): void => {
    if (isAnswered.value || isAnswerRevealed.value || gameEnded.value) return

    selectedOption.value = option
    isAnswered.value = true
    isWaitingForReveal.value = true

    // Звук выбора
    soundManager.playOptionSelect()

    console.log(`✅ Выбран ответ: ${option.id}`)
  }

  // Показать правильный ответ
  const revealAnswer = (): void => {
    if (!isWaitingForReveal.value || isAnswerRevealed.value) return

    isAnswerRevealed.value = true

    const isCorrect = selectedOption.value?.isCorrect || false

    if (isCorrect) {
      // Звук правильного ответа
      soundManager.playCorrect()
      console.log('🎉 Правильный ответ!')
    } else {
      // Звук неправильного ответа
      soundManager.playWrong()
      console.log('❌ Неправильный ответ!')
    }

    // Пауза для подсветки
    setTimeout(() => {
      if (isCorrect) {
        handleCorrectAnswer()
      } else {
        handleWrongAnswer()
      }
    }, 1500)
  }

  // Обработка правильного ответа
  const handleCorrectAnswer = (): void => {
    currentWinnings.value = prizeLevels[currentQuestionIndex.value]

    if (isLastQuestion(currentQuestionIndex.value)) {
      // ПОБЕДА!
      gameResult.value = 'ПОБЕДА! Вы стали миллионером!'
      finalWinnings.value = 1000000
      gameEnded.value = true
      soundManager.playVictoryMusic()
    } else {
      // Переход к следующему вопросу
      nextQuestion()
    }
  }

  // Переход к следующему вопросу
  const nextQuestion = (): void => {
    currentQuestionIndex.value++
    selectedOption.value = null
    isAnswered.value = false
    isAnswerRevealed.value = false
    isWaitingForReveal.value = false
  }

  // Обработка неправильного ответа
  const handleWrongAnswer = (): void => {
    // Определяем гарантированный выигрыш
    if (currentQuestionIndex.value >= 10) {
      finalWinnings.value = prizeLevels[9]
    } else if (currentQuestionIndex.value >= 5) {
      finalWinnings.value = prizeLevels[4]
    } else {
      finalWinnings.value = 0
    }

    gameResult.value = `К сожалению, вы ошиблись!\nВаш выигрыш: ${formatMoney(finalWinnings.value)}`
    gameEnded.value = true
    soundManager.playFailMusic()
  }

  // Забрать деньги
  const takeMoney = (): void => {
    finalWinnings.value = currentWinnings.value
    gameResult.value = `Вы решили забрать деньги!\nВаш выигрыш: ${formatMoney(finalWinnings.value)}`
    gameEnded.value = true
    soundManager.stopMusic()
  }

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
    isLoading: readonly(isLoading),
    currentQuestion,
    progress,
    prizeLevels,
    formatMoney,
    initGame,
    resetGame,
    selectAnswer,
    revealAnswer,
    takeMoney,
  }
}
