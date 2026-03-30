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
  const isAnswered = ref<boolean>(false)
  const isAnswerRevealed = ref<boolean>(false)
  const isWaitingForReveal = ref<boolean>(false)
  const gameEnded = ref<boolean>(false)
  const gameResult = ref<string | null>(null)
  const finalWinnings = ref<number>(0)
  const isLoading = ref<boolean>(true)
  const isCheckingAnswer = ref<boolean>(false)

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

  // Запуск музыки для текущего вопроса
  const startQuestionMusic = (): void => {
    const level = questionNumber.value
    soundManager.playQuestionMusic(level)
  }

  // Инициализация игры
  const initGame = async (): Promise<void> => {
    isLoading.value = true
    await loadQuestions()
    resetGame()
    isLoading.value = false
    console.log('✅ Игра инициализирована, вопросы загружены')
  }

  // Сброс игры
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
  }

  // Выбор ответа
  const selectAnswer = (option: Option): void => {
    if (isAnswered.value || isAnswerRevealed.value || gameEnded.value) return

    console.log(`🎮 selectAnswer: выбран ${option.id}`)

    selectedOption.value = option
    isAnswered.value = true
    isWaitingForReveal.value = true

    // 1. СНАЧАЛА останавливаем музыку
    soundManager.stopMusic()

    // 2. ЗВУК ВЫБОРА (играет сразу после остановки)
    soundManager.playOptionSelect()

    console.log(`✅ Выбран ответ: ${option.id}`)
  }
  // Показать правильный ответ
  const revealAnswer = (): void => {
    if (!isWaitingForReveal.value || isAnswerRevealed.value) return

    isAnswerRevealed.value = true

    const isCorrect = selectedOption.value?.isCorrect || false

    if (isCorrect) {
      soundManager.playCorrect()
      console.log('🎉 Правильный ответ!')
    } else {
      soundManager.playWrong()
      console.log('❌ Неправильный ответ!')
    }

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

    // Запускаем музыку для следующего вопроса
    startQuestionMusic()
  }

  // Обработка неправильного ответа
  const handleWrongAnswer = (): void => {
    // Определяем гарантированный выигрыш
    if (currentQuestionIndex.value >= 10) {
      finalWinnings.value = prizeLevels[9] // 32000
    } else if (currentQuestionIndex.value >= 5) {
      finalWinnings.value = prizeLevels[4] // 1000
    } else {
      finalWinnings.value = 0
    }

    gameResult.value = `К сожалению, вы ошиблись!\nВаш выигрыш: ${formatMoney(finalWinnings.value)}`
    gameEnded.value = true
    soundManager.playFailMusic()
  }

  // Подсказка 50:50
  const useFiftyFifty = (): string[] => {
    if (usedHints.value.fiftyFifty || isAnswered.value) return []

    soundManager.playFiftyFifty()
    usedHints.value.fiftyFifty = true

    const incorrectOptions =
      currentQuestion.value?.options
        .filter((opt) => !opt.isCorrect)
        .slice(0, 2)
        .map((opt) => opt.id) || []

    return incorrectOptions
  }

  // Подсказка "Звонок другу"
  const useCallHint = (): string => {
    if (usedHints.value.call || isAnswered.value) return ''

    soundManager.playCall()
    usedHints.value.call = true

    const correctOption = currentQuestion.value?.options.find((opt) => opt.isCorrect)
    if (!correctOption) return ''

    const probability = Math.random()

    let advice: string
    if (probability > 0.8) {
      advice = `Я уверен на 100%, правильный ответ - ${correctOption.id}`
    } else if (probability > 0.5) {
      advice = `Мне кажется, это ${correctOption.id}, но я не совсем уверен`
    } else {
      const wrongOptions = currentQuestion.value?.options.filter((opt) => !opt.isCorrect) || []
      const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
      advice = `Сложный вопрос... Я думаю, это ${randomWrong?.id}, но лучше проверь`
    }

    return advice
  }

  // Подсказка "Помощь зала"
  const useAudienceHint = (): Array<{ id: string; text: string; percentage: number }> => {
    if (usedHints.value.audience || isAnswered.value) return []

    soundManager.playAudience()
    usedHints.value.audience = true

    const options = currentQuestion.value?.options || []

    const results = options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      percentage: opt.isCorrect
        ? Math.floor(65 + Math.random() * 25)
        : Math.floor(5 + Math.random() * 15),
    }))

    const total = results.reduce((sum, r) => sum + r.percentage, 0)
    results.forEach((r) => {
      r.percentage = Math.floor((r.percentage / total) * 100)
    })

    const sum = results.reduce((s, r) => s + r.percentage, 0)
    if (sum !== 100) {
      results[0].percentage += 100 - sum
    }

    return results
  }

  // Забрать деньги
  const takeMoney = (): void => {
    finalWinnings.value = currentWinnings.value
    gameResult.value = `Вы решили забрать деньги!\nВаш выигрыш: ${formatMoney(finalWinnings.value)}`
    gameEnded.value = true
    soundManager.stopMusic()
  }

  return {
    // Состояние
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
    isCheckingAnswer: readonly(isCheckingAnswer),
    questionNumber: readonly(questionNumber),

    // Вычисляемые
    currentQuestion,
    progress,
    prizeLevels,

    // Методы
    formatMoney,
    initGame,
    resetGame,
    selectAnswer,
    revealAnswer,
    useFiftyFifty,
    useCallHint,
    useAudienceHint,
    takeMoney,
  }
}
