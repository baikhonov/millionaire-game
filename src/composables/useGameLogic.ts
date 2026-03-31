// src/composables/useGameLogic.ts
import { ref, computed, readonly } from 'vue'
import { useQuestions } from './useQuestions'
import { useSoundManager } from './useSoundManager'
import type { Option, UsedHints } from '@/types/game'
import { BASE_URL } from '@/config'

// Настройки задержек (в миллисекундах)
const DELAYS = {
  REVEAL_ANSWER: 1500, // пауза после нажатия "Показать правильный ответ"
  NEXT_QUESTION: 1500, // пауза перед переходом к следующему вопросу (после подсветки)
  FIRST_OPTION: 800, // пауза перед появлением первого варианта
  OPTION_INTERVAL: 1000, // интервал между появлением вариантов
  MILESTONE_EXTRA_DELAY: 2000, // запасная задержка, если не удалось определить длительность
  FINAL_FAIL_EXTRA_DELAY: 3000, // запасная задержка для финального поражения (если не удалось определить длительность)
}

export function useGameLogic() {
  const { loadQuestions, getQuestion, totalQuestions, isLastQuestion } = useQuestions()
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
  const usedHints = ref<UsedHints>({
    fiftyFifty: false,
    call: false,
    audience: false,
  })

  // Для 50:50 — храним скрытые варианты для ТЕКУЩЕГО вопроса
  const hiddenOptions = ref<string[]>([])

  // Подсказка 50:50 — убираем 2 неверных варианта
  const useFiftyFifty = (): void => {
    // Проверяем: можно использовать только 1 раз за игру и пока ответ не выбран
    if (usedHints.value.fiftyFifty || isAnswered.value || isAnswerRevealed.value) {
      return
    }

    usedHints.value.fiftyFifty = true // навсегда блокируем кнопку
    soundManager.stopMusic()
    soundManager.playFiftyFifty()

    // Находим два неправильных варианта для скрытия
    const allOptions = currentQuestion.value?.options || []
    const incorrectOptions = allOptions.filter((opt) => !opt.isCorrect)
    const toHide = incorrectOptions.slice(0, 2).map((opt) => opt.id)

    hiddenOptions.value = toHide
    console.log('🔍 50:50 — скрыты варианты:', toHide)
    console.log('🔍 hiddenOptions.value:', hiddenOptions.value)
  }

  // Подсказка "Звонок другу"
  const useCallHint = (): void => {
    if (usedHints.value.call || isAnswered.value || isAnswerRevealed.value) {
      return
    }

    usedHints.value.call = true // навсегда блокируем кнопку
    soundManager.stopMusic()
    soundManager.playCall()
    console.log(`📞 Звонок другу — игрок звонит оффлайн`)
  }

  // Подсказка "Помощь зала"
  const useAudienceHint = (): void => {
    if (usedHints.value.audience || isAnswered.value || isAnswerRevealed.value) {
      return
    }

    usedHints.value.audience = true // навсегда блокируем кнопку
    soundManager.stopMusic()
    soundManager.playAudience()
    console.log(`👥 Помощь зала — игрок спрашивает зал оффлайн`)
  }

  // Сброс для нового вопроса (только скрытых вариантов)
  const resetHintsForNewQuestion = (): void => {
    // НЕ сбрасываем usedHints — они на всю игру!
    hiddenOptions.value = [] // очищаем скрытые варианты для нового вопроса
  }

  // ========== Появление вариантов ==========
  const optionsRevealed = ref<string[]>([]) // уже показанные варианты (A,B,C,D)
  const isRevealingOptions = ref(false) // идёт ли анимация появления
  let revealTimer: number | null = null // таймер появления
  let currentRevealIndex = 0 // текущий индекс в очереди

  const revealOrder = ref<('A' | 'B' | 'C' | 'D')[]>(['A', 'B', 'C', 'D']) // порядок

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

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽'
  }

  // ========== Музыка ==========
  const startQuestionMusic = async (): Promise<void> => {
    // Если у текущего вопроса есть аудио или видео, музыку не включаем
    if (
      currentQuestion.value?.media?.type === 'audio' ||
      currentQuestion.value?.media?.type === 'video'
    ) {
      console.log('🎵 Музыка отключена из-за медиа-контента')
      return
    }
    const level = questionNumber.value
    await soundManager.playQuestionMusicWithPreload(level)
  }

  // ========== Управление появлением вариантов ==========
  const revealNextOption = (): void => {
    if (currentRevealIndex >= revealOrder.value.length) {
      // Все варианты показаны
      isRevealingOptions.value = false
      currentRevealIndex = 0
      return
    }

    const optionId = revealOrder.value[currentRevealIndex]
    optionsRevealed.value.push(optionId)
    currentRevealIndex++

    // Если ещё есть варианты – планируем следующий
    if (currentRevealIndex < revealOrder.value.length) {
      revealTimer = window.setTimeout(() => {
        revealNextOption()
      }, DELAYS.OPTION_INTERVAL)
    } else {
      // Последний вариант показан, завершаем анимацию
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

    // Небольшая задержка перед первым вариантом
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
    await loadQuestions()
    resetGame()
    isLoading.value = false

    // Загружаем и ждём музыку для первого вопроса
    await startQuestionMusic()

    // После загрузки музыки запускаем появление вариантов
    setTimeout(() => {
      startRevealOptions()
    }, 500)
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

  const selectAnswer = (option: Option): void => {
    if (isAnswered.value || isAnswerRevealed.value || gameEnded.value) return

    // Разрешаем выбрать только те варианты, которые уже появились
    if (!isOptionRevealed(option.id)) {
      console.log(`⚠️ Вариант ${option.id} ещё не появился, нельзя выбрать`)
      return
    }

    selectedOption.value = option
    isAnswered.value = true
    isWaitingForReveal.value = true

    soundManager.stopMusic()
    soundManager.stopAllEffects()
    soundManager.playOptionSelect()
  }

  const revealAnswer = (): void => {
    if (!isWaitingForReveal.value || isAnswerRevealed.value) return

    console.log(`🔍 revealAnswer вызван, isCorrect = ${selectedOption.value?.isCorrect}`)

    soundManager.stopAllEffects()
    isAnswerRevealed.value = true

    const isCorrect = selectedOption.value?.isCorrect || false
    const isFinalQuestion = isLastQuestion(currentQuestionIndex.value)
    const difficulty = currentQuestion.value?.difficulty || 1
    const currentNumber = currentQuestionIndex.value + 1 // номер вопроса (1-15)

    console.log(`🎮 isCorrect: ${isCorrect}, вопрос: ${currentNumber}, difficulty: ${difficulty}`)

    if (isCorrect) {
      console.log(`🎮 Вызываем playVictoryMusic для вопроса ${currentNumber}`)
      soundManager.playVictoryMusic(difficulty, currentNumber)
    } else {
      console.log(`🎮 Вызываем playFailMusic с isFinalQuestion = ${isFinalQuestion}`)
      soundManager.playFailMusic(isFinalQuestion)
    }

    setTimeout(async () => {
      if (isCorrect) {
        await handleCorrectAnswer()
      } else {
        await handleWrongAnswer()
      }
    }, DELAYS.REVEAL_ANSWER)
  }

  const handleCorrectAnswer = async (): Promise<void> => {
    currentWinnings.value = prizeLevels[currentQuestionIndex.value]

    if (isLastQuestion(currentQuestionIndex.value)) {
      gameResult.value = 'ПОБЕДА! Вы стали миллионером!'
      finalWinnings.value = 1000000
      gameEnded.value = true
    } else {
      // Проверяем, является ли вопрос несгораемой суммой (5-й или 10-й)
      const isMilestone = currentQuestionIndex.value === 4 || currentQuestionIndex.value === 9

      if (isMilestone) {
        // Получаем длительность звука victory-milestone.mp3
        const milestoneUrl = `${BASE_URL}sounds/effects/victory-milestone.mp3`
        const duration = await soundManager.getAudioDuration(milestoneUrl)

        // Используем длительность звука + небольшая пауза для плавности
        const extraDelay = duration > 0 ? duration : DELAYS.MILESTONE_EXTRA_DELAY

        console.log(`🎵 Milestone: ждём ${extraDelay}мс перед следующим вопросом`)

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

    // Ждём загрузки музыки для следующего вопроса
    await startQuestionMusic()

    // Запускаем появление вариантов для нового вопроса
    setTimeout(() => {
      startRevealOptions()
    }, 500)
  }

  const handleWrongAnswer = async (): Promise<void> => {
    // Определяем гарантированный выигрыш
    if (currentQuestionIndex.value >= 10) {
      finalWinnings.value = prizeLevels[9]
    } else if (currentQuestionIndex.value >= 5) {
      finalWinnings.value = prizeLevels[4]
    } else {
      finalWinnings.value = 0
    }

    // Проверяем, финальный ли это вопрос (15-й)
    const isFinalQuestion = isLastQuestion(currentQuestionIndex.value)

    if (isFinalQuestion) {
      // Получаем длительность звука fail-final.mp3
      const failFinalUrl = `${BASE_URL}sounds/effects/fail-final.mp3`
      const duration = await soundManager.getAudioDuration(failFinalUrl)

      // Используем длительность звука + небольшая пауза для плавности
      const extraDelay = duration > 0 ? duration : DELAYS.FINAL_FAIL_EXTRA_DELAY

      console.log(`🎵 Финальное поражение: ждём ${extraDelay}мс перед показом экрана`)

      setTimeout(() => {
        gameResult.value = `К сожалению, вы ошиблись!`
        gameEnded.value = true
        soundManager.playGameOverMusic()
      }, extraDelay)
    } else {
      // Обычное поражение
      setTimeout(() => {
        gameResult.value = `К сожалению, вы ошиблись!`
        gameEnded.value = true
        soundManager.playGameOverMusic()
      }, DELAYS.NEXT_QUESTION)
    }
  }

  const takeMoney = (): void => {
    finalWinnings.value = currentWinnings.value
    gameResult.value = `Вы решили забрать деньги!`
    gameEnded.value = true
    soundManager.stopMusic()
    soundManager.stopAllEffects()
  }

  // ========== Возвращаемое API ==========
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
    hiddenOptions: readonly(hiddenOptions),
    isLoading: readonly(isLoading),
    isCheckingAnswer: readonly(isCheckingAnswer),
    questionNumber: readonly(questionNumber),

    // Появление вариантов
    optionsRevealed: readonly(optionsRevealed),
    isRevealingOptions: readonly(isRevealingOptions),
    allOptionsRevealed: readonly(allOptionsRevealed),
    isOptionRevealed,
    startRevealOptions,

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
