<template>
  <div class="millionaire-game">
    <div class="game-background"></div>

    <!-- Стартовая модалка -->
    <div v-if="!gameStarted" class="start-screen">
      <div class="start-card">
        <div class="logo">
          <img src="/images/logo-bm.webp" width="250px" alt="Лого Бачатамания" />
          <img src="/images/logo-game.webp" width="250px" alt="Лого игры" />
        </div>
        <button class="start-button" @click="startGame">Начать игру</button>

        <!-- Кнопка сброса прогресса -->
        <button class="reset-progress-button" @click="resetProgress">
          🔄 Сбросить пул вопросов
        </button>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-else-if="isLoading" class="loading-screen">
      <div class="loader"></div>
      <p>Загрузка игры...</p>
    </div>

    <!-- Игра -->
    <div v-else-if="!gameEnded">
      <div class="top-bar">
        <div class="current-winnings">
          {{ formatMoney(currentWinnings) }}
        </div>
        <div class="question-counter" v-if="currentQuestion">
          Вопрос {{ currentQuestionIndex + 1 }} из {{ totalQuestions }}
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>

      <div class="game-container">
        <div class="game-layout">
          <div class="game-main">
            <div v-if="currentQuestion" class="question-section">
              <QuestionCard :question="currentQuestion" />

              <OptionsGrid
                :key="currentQuestionIndex"
                :options="currentQuestion.options"
                :selected-option="selectedOption"
                :is-answered="isAnswered"
                :is-answer-revealed="isAnswerRevealed"
                :is-revealing="isRevealingOptions"
                :options-revealed="optionsRevealed"
                :hidden-options="hiddenOptions"
                @select="selectAnswer"
              />

              <div class="reveal-button-container">
                <button
                  v-if="isWaitingForReveal && !isAnswerRevealed"
                  class="reveal-button"
                  @click="revealAnswer"
                >
                  🔍 Показать правильный ответ
                </button>
              </div>
            </div>
          </div>
          <div class="game-sidebar">
            <!-- Подсказки -->
            <HintsPanel
              :used-hints="usedHints"
              :disabled="isAnswered || isAnswerRevealed"
              @fifty-fifty="useFiftyFifty"
              @call="useCallHint"
              @audience="useAudienceHint"
            />

            <PrizeLadder
              :prize-levels="prizeLevels"
              :current-index="currentQuestionIndex"
              :format-money="formatMoney"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Экран окончания игры -->
    <div v-else-if="gameEnded" class="game-over-screen">
      <div class="game-over-card">
        <h1>{{ gameResult }}</h1>
        <p class="winnings">Ваш выигрыш: {{ formatMoney(finalWinnings, 'бачатакоинов') }}</p>
        <button class="restart-button" @click="restartGame">Играть снова</button>
      </div>
    </div>

    <!-- Кнопка звука -->
    <button v-if="gameStarted && !gameEnded" class="sound-button" @click.stop="toggleMute">
      {{ isMuted ? '🔇' : '🔊' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useGameLogic } from './composables/useGameLogic'
import { useSoundManager } from './composables/useSoundManager'
import OptionsGrid from './components/game/OptionsGrid.vue'
import QuestionCard from './components/game/QuestionCard.vue'
import PrizeLadder from './components/game/PrizeLadder.vue'
import HintsPanel from './components/game/HintsPanel.vue'

const game = useGameLogic()
const sound = useSoundManager()

const gameStarted = ref(false)

const {
  currentQuestionIndex,
  currentWinnings,
  selectedOption,
  isAnswered,
  isAnswerRevealed,
  isWaitingForReveal,
  gameEnded,
  gameResult,
  finalWinnings,
  isLoading,
  currentQuestion,
  progress,
  prizeLevels,
  formatMoney,
  initGame,
  resetGame,
  selectAnswer: gameSelectAnswer,
  revealAnswer: gameRevealAnswer,
  optionsRevealed,
  isRevealingOptions,
  usedHints,
  hiddenOptions,
  useFiftyFifty,
  useCallHint,
  useAudienceHint,
  startNewGame, // ✅ добавляем
  returnUnusedQuestions, // ✅ добавляем
  resetAllProgress,
} = game

const { isMuted, isAudioEnabled, enableAudio, toggleMute, playQuestionMusic } = sound

const totalQuestions = computed(() => game.prizeLevels.length)

const startGame = async () => {
  console.log('🎮 Начинаем игру')

  enableAudio()
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Вопросы уже загружены через startNewGame в onMounted
  await initGame()

  if (isAudioEnabled.value && !isMuted.value) {
    playQuestionMusic(1)
  }

  gameStarted.value = true
}

const selectAnswer = (option: any) => {
  gameSelectAnswer(option)
}

const revealAnswer = () => {
  gameRevealAnswer()
}

const restartGame = async () => {
  console.log('🔄 Перезапуск игры')

  // Возвращаем неиспользованные вопросы в пул
  returnUnusedQuestions()

  // Генерируем новые вопросы для следующего игрока
  await startNewGame()

  // Сбрасываем состояние игры
  resetGame()

  // Запускаем игру
  await initGame()

  if (isAudioEnabled.value && !isMuted.value) {
    playQuestionMusic(1)
  }
}

// При монтировании — генерируем вопросы для первого игрока
onMounted(async () => {
  console.log('🚀 Приложение загружено, генерируем вопросы')
  await startNewGame()
  console.log('✅ Вопросы готовы, ждём нажатия "Начать игру"')
})

const resetProgress = () => {
  const confirmed = confirm(
    'Вы уверены, что хотите сбросить прогресс? Все вопросы снова станут доступны.',
  )
  if (!confirmed) return

  console.log('🗑️ Сброс прогресса вопросов')

  // Сбрасываем историю использованных вопросов
  resetAllProgress()

  alert('Прогресс вопросов сброшен! Для новой игры нажмите "Начать игру".')
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', 'Helvetica', sans-serif;
  background: linear-gradient(135deg, #0a0f1e 0%, #030617 100%);
  color: #fff;
  overflow-x: hidden;
}

/* Анимации */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.millionaire-game {
  min-height: 100vh;
  position: relative;
}

.game-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 30%, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

/* Стартовый экран */
.start-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #0a0f1e 0%, #030617 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.5s ease;
}

.start-card {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1420 100%);
  border: 2px solid #ffd700;
  border-radius: 20px;
  padding: 50px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
}

.logo {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-bottom: 50px;
}

.start-card h1 {
  color: #ffd700;
  font-size: 32px;
  margin-bottom: 20px;
}

.start-card p {
  color: #ccc;
  font-size: 18px;
  margin-bottom: 30px;
  line-height: 1.5;
}

.start-button {
  padding: 15px 50px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #0a0f1e;
  border: none;
  border-radius: 12px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.start-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
}

/* Загрузка */
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
}

.loader {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 215, 0, 0.3);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Верхняя панель */
.game-container {
  position: relative;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 20px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 40px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.current-winnings {
  font-size: 28px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.question-counter {
  font-size: 18px;
  color: #fff;
}

.progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 10;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  transition: width 0.3s ease;
}

/* Компоновка */
.game-layout {
  display: flex;
  gap: 30px;
  margin-top: 30px;
  padding: 0 20px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.game-main {
  flex: 1;
  min-width: 0;
}

.game-sidebar {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-section {
  margin-top: 0;
  margin-right: 0;
  padding: 0;
}

/* Кнопка показа ответа */
.reveal-button-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.reveal-button {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #0a0f1e;
  border: none;
  border-radius: 12px;
  padding: 15px 40px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.reveal-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
}

/* Экран окончания игры */
.game-over-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.game-over-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1420 100%);
  border: 2px solid #ffd700;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 500px;
  animation: fadeIn 0.5s ease;
}

.game-over-card h1 {
  color: #ffd700;
  font-size: 32px;
  margin-bottom: 20px;
}

.winnings {
  font-size: 24px;
  margin: 20px 0;
}

.restart-button {
  margin-top: 20px;
  padding: 12px 30px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #0a0f1e;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.restart-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

/* Кнопка звука */
.sound-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #ffd700;
  color: #ffd700;
  font-size: 24px;
  cursor: pointer;
  z-index: 100;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.sound-button:hover {
  transform: scale(1.1);
  background: rgba(255, 215, 0, 0.2);
}

/* Адаптивность */
@media (max-width: 900px) {
  .game-layout {
    flex-direction: column;
    gap: 20px;
  }

  .game-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .game-layout {
    margin-top: 100px;
  }

  .game-over-card {
    padding: 30px 10px;
  }

  .top-bar {
    padding: 15px 20px;
  }

  .current-winnings {
    font-size: 20px;
  }

  .question-counter {
    font-size: 14px;
  }

  .reveal-button {
    padding: 10px 15px;
    font-size: 16px;
  }

  .start-card {
    padding: 30px 20px;
    margin: 20px;
  }

  .start-card h1 {
    font-size: 24px;
  }

  .start-button {
    font-size: 18px;
    padding: 12px 30px;
  }
}

@media (max-width: 480px) {
  .game-container {
    padding: 0 15px;
  }

  .game-layout {
    margin-top: 30px;
    padding: 0;
  }

  .question-text {
    font-size: 20px;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }
}
.reset-progress-button {
  margin-top: 20px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #666, #444);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-progress-button:hover {
  transform: scale(1.05);
  background: linear-gradient(135deg, #888, #666);
}
</style>
