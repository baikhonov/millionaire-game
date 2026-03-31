// src/composables/useQuestions.ts
import { ref, readonly } from 'vue'
import type { Question } from '@/types/game'
import { BASE_URL } from '@/config'

export function useQuestions() {
  const questions = ref<Question[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const questionPool = ref<Question[]>([])
  const usedInCurrentSession = ref<number[]>([])

  const loadQuestionPool = async (): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}data/questions-pool.json`)
      if (!response.ok) throw new Error('Failed to load question pool')
      const data = await response.json()
      questionPool.value = data

      const savedUsed = localStorage.getItem('usedQuestions')
      if (savedUsed) {
        usedInCurrentSession.value = JSON.parse(savedUsed)
        console.log(
          `📜 Загружена история: использовано ${usedInCurrentSession.value.length} вопросов из пула`,
        )
      }

      console.log(`📚 Загружен пул вопросов: ${questionPool.value.length} вопросов`)
    } catch (err) {
      console.error('Ошибка загрузки пула вопросов:', err)
    }
  }

  const getRandomQuestionByDifficulty = (
    difficulty: number,
    excludeFromCurrentGame: number[] = [],
  ): Question | null => {
    const excludeIds = [...usedInCurrentSession.value, ...excludeFromCurrentGame]

    const available = questionPool.value.filter(
      (q) => q.difficulty === difficulty && !excludeIds.includes(q.id),
    )

    if (available.length === 0) {
      console.warn(`⚠️ Нет новых вопросов сложности ${difficulty}, используем все доступные`)
      const allByDifficulty = questionPool.value.filter((q) => q.difficulty === difficulty)
      if (allByDifficulty.length === 0) return null
      const randomIndex = Math.floor(Math.random() * allByDifficulty.length)
      return allByDifficulty[randomIndex]
    }

    const randomIndex = Math.floor(Math.random() * available.length)
    return available[randomIndex]
  }

  const generateGameQuestions = (): Question[] => {
    const gameQuestions: Question[] = []
    const currentGameUsedIds: number[] = []

    const difficultyMap = [
      1,
      1,
      1,
      1,
      1, // 1-5
      2,
      2, // 6-7
      2,
      2, // 8-9
      3,
      3, // 10-11
      3,
      3, // 12-13
      4, // 14
      5, // 15
    ]

    for (let i = 0; i < difficultyMap.length; i++) {
      const difficulty = difficultyMap[i]
      const question = getRandomQuestionByDifficulty(difficulty, currentGameUsedIds)

      if (question) {
        currentGameUsedIds.push(question.id)
        gameQuestions.push({ ...question, displayId: i + 1 })
      } else {
        console.error(`❌ Не удалось найти вопрос для позиции ${i + 1}`)
        return []
      }
    }

    return gameQuestions
  }

  const canGenerateFullGame = (): boolean => {
    for (let diff = 1; diff <= 5; diff++) {
      let neededCount = 0
      if (diff === 1) neededCount = 5
      else if (diff === 2) neededCount = 4
      else if (diff === 3) neededCount = 4
      else if (diff === 4) neededCount = 1
      else if (diff === 5) neededCount = 1

      const availableCount = questionPool.value.filter(
        (q) => q.difficulty === diff && !usedInCurrentSession.value.includes(q.id),
      ).length

      if (availableCount < neededCount) {
        console.log(
          `⚠️ Для сложности ${diff} нужно ${neededCount} новых вопросов, доступно ${availableCount}`,
        )
        return false
      }
    }
    return true
  }

  const startNewGame = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      if (questionPool.value.length === 0) {
        await loadQuestionPool()
      }

      if (!canGenerateFullGame()) {
        console.log('🔄 Недостаточно новых вопросов, сбрасываем историю сессии')
        usedInCurrentSession.value = []
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

      const newUsedIds = questions.value.map((q) => q.id)
      usedInCurrentSession.value.push(...newUsedIds)
      localStorage.setItem('usedQuestions', JSON.stringify(usedInCurrentSession.value))

      const remaining = questionPool.value.length - usedInCurrentSession.value.length
      console.log(`✅ Новая игра! Сгенерировано ${questions.value.length} вопросов.`)
      console.log(
        `📊 Прогресс: ${usedInCurrentSession.value.length}/${questionPool.value.length} вопросов использовано. Осталось: ${remaining}`,
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки'
      console.error('Ошибка загрузки вопросов:', err)
    } finally {
      isLoading.value = false
    }
  }

  const returnUnusedQuestions = (): void => {
    if (questions.value.length === 0) return

    const currentGameIds = questions.value.map((q) => q.id)
    usedInCurrentSession.value = usedInCurrentSession.value.filter(
      (id) => !currentGameIds.includes(id),
    )
    localStorage.setItem('usedQuestions', JSON.stringify(usedInCurrentSession.value))

    console.log(
      `🔄 Возвращено ${currentGameIds.length} вопросов в пул. Осталось использовано: ${usedInCurrentSession.value.length}`,
    )
  }

  const resetAllProgress = (): void => {
    usedInCurrentSession.value = []
    localStorage.removeItem('usedQuestions')
    console.log('🗑️ Весь прогресс сброшен')
  }

  const getQuestion = (index: number): Question | null => {
    return questions.value[index] || null
  }

  const totalQuestions = (): number => {
    return questions.value.length
  }

  const isLastQuestion = (index: number): boolean => {
    return index === questions.value.length - 1
  }

  const getQuestionsStats = (): { used: number; total: number; remaining: number } => {
    return {
      used: usedInCurrentSession.value.length,
      total: questionPool.value.length,
      remaining: questionPool.value.length - usedInCurrentSession.value.length,
    }
  }

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
