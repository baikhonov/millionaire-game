// src/types/game.ts
// Это как словарь всех понятий игры

// Тип медиа-контента
export type MediaType = 'image' | 'audio' | 'video'

// Медиа-контент для вопроса
export interface MediaContent {
  type: MediaType
  url: string
  thumbnail?: string // превью для видео/аудио
  caption?: string // подпись
  autoplay?: boolean // автоматическое воспроизведение
  poster?: string // постер для видео
}

// Вариант ответа
export interface Option {
  id: 'A' | 'B' | 'C' | 'D'
  text: string
  isCorrect: boolean
}

// Вопрос
export interface Question {
  id: number
  text: string
  media?: MediaContent
  options: Option[]
  prize: number
  difficulty: 1 | 2 | 3 | 4 | 5 // сложность вопроса
  hint?: string
}

// Состояние игры
export interface GameState {
  currentQuestionIndex: number
  currentWinnings: number
  selectedOption: Option | null
  isAnswered: boolean
  gameEnded: boolean
  gameResult: string | null
  finalWinnings: number
  usedHints: UsedHints
}

// Использованные подсказки
export interface UsedHints {
  fiftyFifty: boolean
  call: boolean
  audience: boolean
}

// Результат голосования зала
export interface AudienceResult {
  id: string
  text: string
  percentage: number
}
