<!-- src/components/game/OptionsGrid.vue -->
<template>
  <div class="options-grid">
    <button
      v-for="option in options"
      :key="option.id"
      class="option-button"
      :class="{
        selected: selectedOption?.id === option.id,
        'correct-revealed': isAnswerRevealed && option.isCorrect,
        'wrong-revealed': isAnswerRevealed && selectedOption?.id === option.id && !option.isCorrect,
      }"
      :disabled="isAnswered || isAnswerRevealed"
      @click="handleSelect(option)"
    >
      <span class="option-letter">{{ option.id }}</span>
      <span class="option-text">{{ option.text }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Option } from '@/types/game'

// Определяем props
const props = defineProps<{
  options: Option[]
  selectedOption: Option | null
  isAnswered: boolean
  isAnswerRevealed: boolean
}>()

// Определяем emits
const emit = defineEmits<{
  (e: 'select', option: Option): void
}>()

// Обработчик выбора
const handleSelect = (option: Option) => {
  // Используем props.isAnswered и props.isAnswerRevealed
  if (!props.isAnswered && !props.isAnswerRevealed) {
    emit('select', option)
  }
}
</script>

<style scoped>
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin: 40px auto;
  max-width: 900px;
}

.option-button {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1420 100%);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 20px 25px;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  text-align: left;
}

.option-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #2a2f3e 0%, #1f2430 100%);
}

.option-button:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

/* Подсветка выбранного варианта */
.option-button.selected {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-color: #ffaa00;
  color: #0a0f1e;
  transform: scale(1.02);
}

.option-button.selected .option-letter {
  background: #0a0f1e;
  color: #ffd700;
}

/* Подсветка правильного ответа (после раскрытия) */
.option-button.correct-revealed {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  border-color: #4caf50;
  animation: pulse 0.5s ease;
}

/* Подсветка неправильного ответа (после раскрытия) */
.option-button.wrong-revealed {
  background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
  border-color: #f44336;
  animation: shake 0.5s ease;
}

.option-letter {
  display: inline-block;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background: #ffd700;
  color: #0a0f1e;
  border-radius: 50%;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
}

.option-text {
  flex: 1;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
  }
  100% {
    transform: scale(1);
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
</style>
