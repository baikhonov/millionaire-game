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

  // Номер вопроса (1-15)
  const questionNumber = computed(() => currentQuestionIndex.value + 1)

  // Прогресс
  const progress = computed(() => {
    if (totalQuestions() === 0) return 0
    return (questionNumber.value / totalQuestions()) * 100
  })

  // Форматирование денег
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

    // Запускаем музыку для первого вопроса
    startQuestionMusic()
  }

  // Сброс игры
  const resetGame = (): void => {
    currentQuestionIndex.value = 0
    currentWinnings.value = 0
    selectedOption.value = null
    isAnswered.value = false
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
  const selectAnswer = async (option: Option): Promise<void> => {
    if (isAnswered.value || isCheckingAnswer.value) return

    isCheckingAnswer.value = true
    selectedOption.value = option

    // Звук выбора варианта (короткий щелчок, музыка продолжается)
    soundManager.playOptionSelect()

    // Пауза для эффекта
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (option.isCorrect) {
      await handleCorrectAnswer()
    } else {
      await handleWrongAnswer()
    }

    isCheckingAnswer.value = false
  }

  // Обработка правильного ответа
  const handleCorrectAnswer = async (): Promise<void> => {
    // Фанфары правильного ответа
    soundManager.playCorrect()

    currentWinnings.value = prizeLevels[currentQuestionIndex.value]

    // Пауза для эффекта
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (isLastQuestion(currentQuestionIndex.value)) {
      // ПОБЕДА!
      gameResult.value = 'ПОБЕДА! Вы стали миллионером!'
      finalWinnings.value = 1000000
      gameEnded.value = true

      // Останавливаем текущую музыку, играем победную
      soundManager.playVictoryMusic()
    } else {
      // Переход к следующему вопросу
      currentQuestionIndex.value++
      isAnswered.value = false
      selectedOption.value = null

      // Запускаем новую музыку для следующего вопроса
      startQuestionMusic()
    }
  }

  // Обработка неправильного ответа
  const handleWrongAnswer = async (): Promise<void> => {
    // Звук неправильного ответа (buzzer)
    soundManager.playWrong()

    // Определяем гарантированный выигрыш
    if (currentQuestionIndex.value >= 10) {
      finalWinnings.value = prizeLevels[9] // 32000
    } else if (currentQuestionIndex.value >= 5) {
      finalWinnings.value = prizeLevels[4] // 1000
    } else {
      finalWinnings.value = 0
    }

    gameResult.value = 'К сожалению, вы ошиблись!'
    gameEnded.value = true

    // Останавливаем музыку, играем грустную
    soundManager.playFailMusic()
  }

  // Подсказка 50:50
  const useFiftyFifty = (): string[] => {
    if (usedHints.value.fiftyFifty || isAnswered.value) return []

    // Звук подсказки
    soundManager.playFiftyFifty()
    usedHints.value.fiftyFifty = true

    // Находим два неправильных варианта для удаления
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

    // Звук звонка
    soundManager.playCall()
    usedHints.value.call = true

    const correctOption = currentQuestion.value?.options.find((opt) => opt.isCorrect)
    if (!correctOption) return ''

    // Генерируем случайный ответ друга
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

    // Звук помощи зала
    soundManager.playAudience()
    usedHints.value.audience = true

    const options = currentQuestion.value?.options || []

    // Генерируем проценты голосования
    const results = options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      percentage: opt.isCorrect
        ? Math.floor(65 + Math.random() * 25) // правильный ответ 65-90%
        : Math.floor(5 + Math.random() * 15), // неправильные 5-20%
    }))

    // Нормализуем проценты (чтобы в сумме было 100)
    const total = results.reduce((sum, r) => sum + r.percentage, 0)
    results.forEach((r) => {
      r.percentage = Math.floor((r.percentage / total) * 100)
    })

    // Корректируем округление, чтобы сумма была 100
    const sum = results.reduce((s, r) => s + r.percentage, 0)
    if (sum !== 100) {
      results[0].percentage += 100 - sum
    }

    return results
  }

  // Забрать деньги
  const takeMoney = (): void => {
    finalWinnings.value = currentWinnings.value
    gameResult.value = 'Вы решили забрать деньги!'
    gameEnded.value = true

    // Останавливаем музыку
    soundManager.stopMusic()
  }

  return {
    // Состояние (только для чтения)
    currentQuestionIndex: readonly(currentQuestionIndex),
    currentWinnings: readonly(currentWinnings),
    selectedOption: readonly(selectedOption),
    isAnswered: readonly(isAnswered),
    gameEnded: readonly(gameEnded),
    gameResult: readonly(gameResult),
    finalWinnings: readonly(finalWinnings),
    usedHints: readonly(usedHints),
    isLoading: readonly(isLoading),
    isCheckingAnswer: readonly(isCheckingAnswer),
    questionNumber: readonly(questionNumber),

    // Вычисляемые свойства
    currentQuestion,
    progress,
    prizeLevels,

    // Методы
    formatMoney,
    initGame,
    resetGame,
    selectAnswer,
    useFiftyFifty,
    useCallHint,
    useAudienceHint,
    takeMoney,
  }
}
