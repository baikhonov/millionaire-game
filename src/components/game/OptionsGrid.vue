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
        'fifty-fifty-removed': hiddenOptions?.includes(option.id),
      }"
      :disabled="
        isAnswered ||
        isAnswerRevealed ||
        !isOptionRevealed(option.id) ||
        hiddenOptions?.includes(option.id)
      "
      @click="handleSelect(option)"
    >
      <span
        v-if="!hiddenOptions?.includes(option.id)"
        class="option-letter"
        :class="{ revealed: isOptionRevealed(option.id) }"
      >
        {{ option.id }}:
      </span>
      <span class="option-text" :class="{ revealed: isOptionRevealed(option.id) }">
        {{ hiddenOptions?.includes(option.id) ? '' : option.text }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Option } from '@/types/game'

const props = defineProps<{
  options: Option[]
  selectedOption: Option | null
  isAnswered: boolean
  isAnswerRevealed: boolean
  isRevealing?: boolean
  optionsRevealed?: string[]
  hiddenOptions?: string[]
}>()

const emit = defineEmits<{
  (e: 'select', option: Option): void
}>()

// Проверка, появился ли вариант
const isOptionRevealed = (optionId: string): boolean => {
  if (!props.optionsRevealed) return true
  // ✅ Разрешаем выбор, как только вариант появился (не ждём остальные)
  return props.optionsRevealed.includes(optionId)
}

const handleSelect = (option: Option) => {
  // ✅ Можно выбрать только если вариант уже появился
  if (
    !props.isAnswered &&
    !props.isAnswerRevealed &&
    isOptionRevealed(option.id) &&
    !props.hiddenOptions?.includes(option.id)
  ) {
    emit('select', option)
  }
}
</script>

<style scoped>
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin: 20px auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.option-button {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1420 100%);
  border: 2px solid #ffd700;
  border-radius: 12px;
  min-height: 68px;
  padding: 20px 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  text-align: left;
  font-size: 28px;

  @media (max-width: 768px) {
    min-height: 48px;
    padding: 10px 15px;

    font-size: 18px;
  }
}

.option-letter {
  display: inline-block;
  text-align: center;
  color: #ffd700;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
  transition: opacity 0.4s ease-out;
  opacity: 0;

  @media (max-width: 768px) {
    width: auto;
    margin-right: 10px;
  }
}

.option-letter.revealed {
  opacity: 1;
}

.option-text {
  flex: 1;
  color: white;
  transition: opacity 0.4s ease-out;
  opacity: 0;
}

.option-text.revealed {
  opacity: 1;
}

.option-button.selected {
  background: #f68e00;
  border-color: #ffaa00;
}

.option-button.selected .option-letter {
  color: #fff;
}

.option-button.selected .option-text {
  color: #0a0f1e;
}

.option-button.correct-revealed {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  border-color: #4caf50;
  animation: pulse 0.5s ease;
}

.option-button.correct-revealed .option-text {
  color: white;
}

.option-button.wrong-revealed {
  background: linear-gradient(135deg, #c62828 0%, #b71c1c 100%);
  border-color: #f44336;
  animation: shake 0.5s ease;
}

.option-button.wrong-revealed .option-text {
  color: white;
}

.option-button:hover:not(:disabled):not(.selected) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #2a2f3e 0%, #1f2430 100%);
}

.option-button:disabled {
  cursor: not-allowed;
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

.option-button.fifty-fifty-removed {
  opacity: 0.6;
  cursor: not-allowed;
}

.option-button.fifty-fifty-removed .option-text {
  color: #666;
  font-style: italic;
}

/* Переопределяем hover для убранных вариантов */
.option-button.fifty-fifty-removed:hover:not(:disabled) {
  transform: none;
  box-shadow: none;
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1420 100%);
}
</style>
