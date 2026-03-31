import { ref, readonly } from 'vue'
import type { Question } from '@/types/game'
import { BASE_URL } from '@/config'

export function useQuestions() {
  const questions = ref<Question[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const questionPool = ref<Question[]>([])
  const usedGlobally = ref<number[]>([]) // все использованные вопросы, сохраняются в localStorage
  const usedInCurrentGame: number[] = [] // текущая игра

  // ========== Загрузка пула вопросов ==========
  const loadQuestionPool = async (): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}data/questions-pool.json`)
      if (!response.ok) throw new Error('Failed to load question pool')
      const data = await response.json()
      questionPool.value = data

      const savedUsed = localStorage.getItem('usedQuestions')
      if (savedUsed) {
        usedGlobally.value = JSON.parse(savedUsed)
        console.log(
          `📜 Загружена история: использовано ${usedGlobally.value.length} вопросов из пула`,
        )
      }

      console.log(`📚 Загружен пул вопросов: ${questionPool.value.length} вопросов`)
    } catch (err) {
      console.error('Ошибка загрузки пула вопросов:', err)
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки'
    }
  }

  // Функция для случайного перемешивания массива (алгоритм Фишера-Йетса)
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Функция для перемешивания вариантов ответа с сохранением правильного
  const shuffleOptions = (options: Option[]): Option[] => {
    const shuffled = shuffleArray(options)
    const newIds: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']
    return shuffled.map((opt, index) => ({
      ...opt,
      id: newIds[index],
    }))
  }

  // ========== Получение случайного вопроса нужной сложности ==========
  const getRandomQuestionByDifficulty = (
    difficulty: number,
    excludeFromCurrentGame: number[] = [],
  ): Question | null => {
    const excludeIds = [...usedGlobally.value, ...excludeFromCurrentGame]

    const available = questionPool.value.filter(
      (q) => q.difficulty === difficulty && !excludeIds.includes(q.id),
    )

    if (available.length === 0) return null

    const randomIndex = Math.floor(Math.random() * available.length)
    return available[randomIndex]
  }

  // ========== Генерация вопросов для одной игры ==========
  const generateGameQuestions = (): Question[] => {
    const gameQuestions: Question[] = []
    usedInCurrentGame.length = 0 // очищаем текущую игру

    const difficultyMap = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 5] // 15 вопросов

    for (let i = 0; i < difficultyMap.length; i++) {
      const difficulty = difficultyMap[i]

      // Пытаемся найти новый вопрос
      let question = getRandomQuestionByDifficulty(difficulty, usedInCurrentGame)

      // Если нет новых вопросов этой сложности, ищем среди всех (включая использованные)
      if (!question) {
        console.warn(`⚠️ Нет новых вопросов сложности ${difficulty}, ищем среди всех`)
        const allWithDifficulty = questionPool.value.filter(
          (q) => q.difficulty === difficulty && !usedInCurrentGame.includes(q.id),
        )
        if (allWithDifficulty.length > 0) {
          const randomIndex = Math.floor(Math.random() * allWithDifficulty.length)
          question = allWithDifficulty[randomIndex]
        }
      }

      // Если всё равно нет вопросов этой сложности, берём любой доступный вопрос
      if (!question) {
        console.warn(`⚠️ Нет вопросов сложности ${difficulty}, берём любой доступный`)
        const anyAvailable = questionPool.value.filter((q) => !usedInCurrentGame.includes(q.id))
        if (anyAvailable.length > 0) {
          const randomIndex = Math.floor(Math.random() * anyAvailable.length)
          question = anyAvailable[randomIndex]
          console.log(`📌 Взяли вопрос сложности ${question.difficulty} вместо ${difficulty}`)
        }
      }

      // Если совсем нет вопросов, выходим с тем, что есть
      if (!question) {
        console.error(
          `❌ Нет доступных вопросов для позиции ${i + 1}, формируем из ${gameQuestions.length} вопросов`,
        )
        break
      }

      usedInCurrentGame.push(question.id)

      // Перемешиваем варианты ответов
      const shuffledOptions = shuffleOptions(question.options)

      gameQuestions.push({
        ...question,
        options: shuffledOptions,
        displayId: i + 1,
      })
    }

    // Если получилось меньше 15 вопросов, выводим предупреждение
    if (gameQuestions.length < 15) {
      console.warn(`⚠️ Сгенерировано только ${gameQuestions.length} вопросов из 15`)
    } else {
      // добавляем в глобальную историю только если получили полный набор
      usedGlobally.value.push(...usedInCurrentGame)
      localStorage.setItem('usedQuestions', JSON.stringify(usedGlobally.value))
    }

    return gameQuestions
  }

  // ========== Проверка возможности сгенерировать полную игру ==========
  const canGenerateFullGame = (): boolean => {
    const neededByDifficulty = { 1: 5, 2: 4, 3: 4, 4: 1, 5: 1 }

    return Object.entries(neededByDifficulty).every(([diff, needed]) => {
      const available = questionPool.value.filter(
        (q) => q.difficulty === Number(diff) && !usedGlobally.value.includes(q.id),
      ).length
      return available >= needed
    })
  }

  // ========== Старт новой игры ==========
  const startNewGame = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      if (questionPool.value.length === 0) {
        await loadQuestionPool()
      }

      if (!canGenerateFullGame()) {
        alert('📚 Все вопросы из пула использованы. История сброшена.')
        usedGlobally.value = []
        localStorage.removeItem('usedQuestions')
      }

      let newQuestions = generateGameQuestions()
      let attempts = 0
      const maxAttempts = 5

      while (newQuestions.length === 0 && attempts < maxAttempts) {
        console.log(`🔄 Повторная попытка генерации (${attempts + 1}/${maxAttempts})`)
        newQuestions = generateGameQuestions()
        attempts++
      }

      if (newQuestions.length === 0) {
        throw new Error('Не удалось сгенерировать вопросы')
      }

      questions.value = newQuestions

      const remaining = questionPool.value.length - usedGlobally.value.length
      console.log(`✅ Новая игра! Сгенерировано ${questions.value.length} вопросов.`)
      console.log(
        `📊 Прогресс: ${usedGlobally.value.length}/${questionPool.value.length} вопросов использовано. Осталось: ${remaining}`,
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки'
      console.error('Ошибка загрузки вопросов:', err)
    } finally {
      isLoading.value = false
    }
  }

  // ========== Возврат вопросов в пул (редко нужно) ==========
  const returnUnusedQuestions = (): void => {
    if (questions.value.length === 0) return
    const currentGameIds = questions.value.map((q) => q.id)
    usedGlobally.value = usedGlobally.value.filter((id) => !currentGameIds.includes(id))
    localStorage.setItem('usedQuestions', JSON.stringify(usedGlobally.value))
    console.log(
      `🔄 Возвращено ${currentGameIds.length} вопросов в пул. Осталось использовано: ${usedGlobally.value.length}`,
    )
  }

  const resetAllProgress = (): void => {
    usedGlobally.value = []
    localStorage.removeItem('usedQuestions')
    console.log('🗑️ Весь прогресс сброшен')
  }

  const getQuestion = (index: number): Question | null => questions.value[index] || null
  const totalQuestions = (): number => questions.value.length
  const isLastQuestion = (index: number): boolean => index === questions.value.length - 1
  const getQuestionsStats = (): { used: number; total: number; remaining: number } => ({
    used: usedGlobally.value.length,
    total: questionPool.value.length,
    remaining: questionPool.value.length - usedGlobally.value.length,
  })

  return {
    questions: readonly(questions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    startNewGame,
    returnUnusedQuestions,
    resetAllProgress,
    getQuestionsStats,
    getQuestion,
    totalQuestions,
    isLastQuestion,
  }
}
