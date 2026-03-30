// src/composables/useGameLogic.ts (обновлённая версия с звуками)
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

  // Подсказки
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

  // Прогресс
  const progress = computed(() => {
    if (totalQuestions() === 0) return 0
    return ((currentQuestionIndex.value + 1) / totalQuestions()) * 100
  })

  // Проверка на сложный вопрос (напряжённая музыка)
  const isDifficultQuestion = computed(() => {
    return currentQuestionIndex.value >= 10 // после 10-го вопроса
  })

  // Форматирование денег
  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽'
  }

  // Инициализация игры
  const initGame = async (): Promise<void> => {
    isLoading.value = true
    await loadQuestions()
    resetGame()
    isLoading.value = false

    // Запускаем музыку
    soundManager.playBackgroundMusic('main')
    soundManager.playEffect('questionStart')
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

  // Переход к следующему вопросу
  const nextQuestion = (): void => {
    currentQuestionIndex.value++
    isAnswered.value = false
    selectedOption.value = null

    // Меняем музыку в зависимости от сложности
    if (isDifficultQuestion.value) {
      soundManager.playBackgroundMusic('tension')
    } else {
      soundManager.playBackgroundMusic('main')
    }

    // Звук нового вопроса
    soundManager.playEffect('questionStart')
  }

  // Выбор ответа
  const selectAnswer = async (option: Option): Promise<void> => {
    if (isAnswered.value || isCheckingAnswer.value) return

    isCheckingAnswer.value = true
    selectedOption.value = option

    // Звук выбора варианта
    soundManager.playOptionSelect(option.id)

    // Пауза и звук финального ответа
    await new Promise((resolve) => setTimeout(resolve, 500))
    soundManager.playFinalAnswer()

    // Драматическая пауза перед проверкой
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (option.isCorrect) {
      await handleCorrectAnswer()
    } else {
      await handleWrongAnswer()
    }

    isCheckingAnswer.value = false
  }

  // Обработка правильного ответа
  const handleCorrectAnswer = async (): Promise<void> => {
    // Звук правильного ответа
    soundManager.playEffect('correct')

    // Аплодисменты
    setTimeout(() => {
      soundManager.playEffect('applause')
    }, 500)

    currentWinnings.value = prizeLevels[currentQuestionIndex.value]

    // Пауза для радости
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (isLastQuestion(currentQuestionIndex.value)) {
      // ПОБЕДА!
      gameResult.value = 'ПОБЕДА! Вы стали миллионером!'
      finalWinnings.value = 1000000
      gameEnded.value = true
      soundManager.playVictorySequence()
    } else {
      // Следующий вопрос
      nextQuestion()
    }
  }

  // Обработка неправильного ответа
  const handleWrongAnswer = async (): Promise<void> => {
    // Звук неправильного ответа
    soundManager.playEffect('wrong')

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

    // Музыка поражения
    soundManager.playFailSequence()
  }

  // Подсказка 50:50
  const useFiftyFifty = (): string[] => {
    if (usedHints.value.fiftyFifty || isAnswered.value) return []

    soundManager.playEffect('fiftyFifty')
    usedHints.value.fiftyFifty = true

    // Возвращаем варианты для скрытия
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

    soundManager.playEffect('call')
    usedHints.value.call = true

    // Генерируем совет друга
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

    soundManager.playEffect('audience')
    usedHints.value.audience = true

    // Генерируем проценты голосования
    const options = currentQuestion.value?.options || []
    const results = options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      percentage: opt.isCorrect
        ? Math.floor(65 + Math.random() * 25)
        : Math.floor(5 + Math.random() * 15),
    }))

    // Нормализуем проценты
    const total = results.reduce((sum, r) => sum + r.percentage, 0)
    results.forEach((r) => {
      r.percentage = Math.floor((r.percentage / total) * 100)
    })

    return results
  }

  // Забрать деньги
  const takeMoney = (): void => {
    finalWinnings.value = currentWinnings.value
    gameResult.value = 'Вы решили забрать деньги!'
    gameEnded.value = true
    soundManager.playEffect('applause')
  }

  return {
    // Состояние
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

    // Вычисляемые
    currentQuestion,
    progress,
    prizeLevels,
    isDifficultQuestion,

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
