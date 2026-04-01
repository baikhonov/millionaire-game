// src/composables/useQuestions.ts
import { ref, readonly } from 'vue'
import type { Question, Option } from '@/types/game'
import { BASE_URL } from '@/config'

export function useQuestions() {
  const questions = ref<Question[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const setsList = ref<{ id: number; name: string; file: string }[]>([])
  const usedSetIds = ref<number[]>([])
  const allSetsUsed = ref(false)
  const currentSetName = ref<string>('')

  // Функция для случайного перемешивания массива
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Функция для перемешивания вариантов ответа
  const shuffleOptions = (options: Option[]): Option[] => {
    const shuffled = shuffleArray(options)
    const newIds: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']
    return shuffled.map((opt, index) => ({
      ...opt,
      id: newIds[index],
    }))
  }

  // Загрузка списка сетов
  const loadSetsList = async (): Promise<void> => {
    try {
      const url = `${BASE_URL}data/sets.json`
      console.log(`📥 Загружаем список сетов: ${url}`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: не удалось загрузить список сетов`)
      }

      const data = await response.json()

      if (!data.sets || !Array.isArray(data.sets)) {
        throw new Error('Неверный формат файла sets.json')
      }

      setsList.value = data.sets
      console.log(`📚 Загружено сетов: ${setsList.value.length}`)

      const savedUsedSets = localStorage.getItem('usedSets')
      if (savedUsedSets) {
        usedSetIds.value = JSON.parse(savedUsedSets)
        console.log(`📜 Загружена история: использовано ${usedSetIds.value.length} сетов`)
      }

      allSetsUsed.value =
        usedSetIds.value.length >= setsList.value.length && setsList.value.length > 0

      if (allSetsUsed.value) {
        console.log('🏁 Все сеты использованы! Нажмите "Сбросить пул вопросов" для продолжения.')
      } else if (usedSetIds.value.length > 0) {
        const nextSet = setsList.value.find((s) => !usedSetIds.value.includes(s.id))
        console.log(`🎯 Следующий сет: ${nextSet?.name || 'не определён'}`)
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки списка сетов:', err)
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки списка сетов'
      setsList.value = []
    }
  }

  // Загрузка конкретного сета
  const loadSet = async (setId: number): Promise<Question[]> => {
    const setInfo = setsList.value.find((s) => s.id === setId)
    if (!setInfo) {
      throw new Error(`Сет с ID ${setId} не найден в списке`)
    }

    const filePath = setInfo.file.startsWith('/') ? setInfo.file.slice(1) : setInfo.file
    const fullUrl = `${BASE_URL}${filePath}`
    console.log(`📥 Загружаем сет "${setInfo.name}": ${fullUrl}`)

    const response = await fetch(fullUrl)

    if (!response.ok) {
      throw new Error(
        `Сет "${setInfo.name}" не найден (HTTP ${response.status}). Файл: ${filePath}`,
      )
    }

    const text = await response.text()

    try {
      const data = JSON.parse(text)

      if (!Array.isArray(data)) {
        throw new Error('Файл сета должен содержать массив вопросов')
      }

      if (data.length === 0) {
        throw new Error('Сет не содержит вопросов')
      }

      console.log(`✅ Загружено ${data.length} вопросов из сета "${setInfo.name}"`)

      return data.map((q: Question, index: number) => ({
        ...q,
        options: shuffleOptions(q.options),
      }))
    } catch (e) {
      console.error(`❌ Ошибка парсинга JSON для сета "${setInfo.name}":`, e)
      throw new Error(`Сет "${setInfo.name}" имеет неверный формат. Ожидался массив вопросов.`)
    }
  }

  // Получение следующего неиспользованного сета
  const getNextUnusedSet = (): { id: number; name: string; file: string } | null => {
    if (setsList.value.length === 0) {
      console.warn('⚠️ Список сетов пуст')
      return null
    }

    const availableSets = setsList.value.filter((s) => !usedSetIds.value.includes(s.id))

    if (availableSets.length === 0) {
      console.log('⚠️ Все сеты уже использованы в этой сессии')
      allSetsUsed.value = true
      return null
    }

    allSetsUsed.value = false
    return availableSets[0]
  }

  const canStartNewGame = (): boolean => {
    // Если есть неиспользованные сеты
    const availableSets = setsList.value.filter((s) => !usedSetIds.value.includes(s.id))
    return availableSets.length > 0
  }

  // Старт новой игры
  const startNewGame = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      if (setsList.value.length === 0) {
        await loadSetsList()
      }

      if (setsList.value.length === 0) {
        throw new Error('Нет доступных сетов вопросов. Проверьте файл data/sets.json')
      }

      const nextSet = getNextUnusedSet()
      if (!nextSet) {
        error.value =
          'Все сеты вопросов использованы. Нажмите "Сбросить пул вопросов" чтобы продолжить.'
        allSetsUsed.value = true
        isLoading.value = false
        return
      }

      currentSetName.value = nextSet.name
      console.log(`🎮 Загружаем сет: ${nextSet.name} (ID: ${nextSet.id})`)

      const loadedQuestions = await loadSet(nextSet.id)

      questions.value = loadedQuestions.map((q, index) => ({
        ...q,
        displayId: index + 1,
      }))

      usedSetIds.value.push(nextSet.id)
      localStorage.setItem('usedSets', JSON.stringify(usedSetIds.value))

      const remaining = setsList.value.length - usedSetIds.value.length
      // ✅ allSetsUsed = true ТОЛЬКО если нет сетов для следующей игры
      // НЕ устанавливаем allSetsUsed = true при загрузке последнего сета
      allSetsUsed.value = false // всегда false при старте игры

      console.log(
        `✅ Игра готова! Сет "${nextSet.name}" загружен. Вопросов в сете: ${questions.value.length}`,
      )
      console.log(
        `📊 Прогресс: ${usedSetIds.value.length}/${setsList.value.length} сетов использовано`,
      )

      if (questions.value.length < 15) {
        console.log(
          `ℹ️ Внимание! В сете только ${questions.value.length} вопросов. Игра будет короче.`,
        )
      }

      if (remaining === 0) {
        console.log(
          'ℹ️ После этой игры все сеты будут использованы. Для следующей игры нажмите "Сбросить пул вопросов".',
        )
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки вопросов'
      console.error('❌ Ошибка загрузки вопросов:', err)
      questions.value = []
    } finally {
      isLoading.value = false
    }
  }

  const markAllSetsUsed = (): void => {
    if (usedSetIds.value.length >= setsList.value.length && setsList.value.length > 0) {
      allSetsUsed.value = true
      console.log('🏁 Все сеты использованы! Нажмите "Сбросить пул вопросов" для продолжения.')
    }
  }

  // Возврат текущего сета (не используется)
  const returnCurrentSet = (): void => {
    console.log('🔄 Возврат текущего сета в пул (не требуется)')
  }

  // Сброс всего прогресса
  const resetAllProgress = (): void => {
    console.log('🔧 resetAllProgress: сброс usedSetIds')
    usedSetIds.value = []
    allSetsUsed.value = false
    localStorage.removeItem('usedSets')
    console.log('🗑️ Весь прогресс сброшен. Все сеты снова доступны.')
  }

  const getQuestion = (index: number): Question | null => questions.value[index] || null
  const totalQuestions = (): number => questions.value.length
  const isLastQuestion = (index: number): boolean => index === questions.value.length - 1
  const getQuestionsStats = (): { used: number; total: number; remaining: number } => ({
    used: usedSetIds.value.length,
    total: setsList.value.length,
    remaining: setsList.value.length - usedSetIds.value.length,
  })

  return {
    questions: readonly(questions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    allSetsUsed: readonly(allSetsUsed),
    currentSetName: readonly(currentSetName),
    startNewGame,
    returnCurrentSet,
    resetAllProgress,
    getQuestionsStats,
    getQuestion,
    totalQuestions,
    isLastQuestion,
    markAllSetsUsed,
  }
}
