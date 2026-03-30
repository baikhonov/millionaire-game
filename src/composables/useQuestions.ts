// src/composables/useQuestions.ts
import { ref, readonly } from 'vue'
import type { Question } from '@/types/game'

export function useQuestions() {
  const questions = ref<Question[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadQuestions = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      // Важно: файл должен быть в папке public, так как он загружается через fetch
      // Положите questions.json в public/data/questions.json
      const response = await fetch('/data/questions.json')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      questions.value = data
      console.log('Вопросы загружены:', data.length) // Для отладки
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки'
      console.error('Ошибка загрузки вопросов:', err)
    } finally {
      isLoading.value = false
    }
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

  return {
    questions: readonly(questions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadQuestions,
    getQuestion,
    totalQuestions,
    isLastQuestion,
  }
}
