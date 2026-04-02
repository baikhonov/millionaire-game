<template>
  <div class="prize-ladder">
    <div
      v-for="(prize, reverseIndex) in reversedPrizeLevels"
      :key="reverseIndex"
      class="prize-step"
      :class="{
        current: getOriginalIndex(reverseIndex) === currentIndex,
        passed: getOriginalIndex(reverseIndex) < currentIndex,
        milestone: isMilestone(getOriginalIndex(reverseIndex)),
      }"
    >
      {{ getOriginalIndex(reverseIndex) + 1 }}
      <span style="font-size: 0.7em; color: yellow">⬥</span>
      {{ formatMoney(prize) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  prizeLevels: number[]
  currentIndex: number
  formatMoney: (amount: number) => string
}>()

// Проверка на несгораемую сумму (5-й, 10-й, 15-й вопросы)
const isMilestone = (index: number): boolean => {
  // index - это номер вопроса (0-14), где 0 = 1-й вопрос
  return index === 4 || index === 9 || index === 14
}

// Получаем оригинальный индекс из обратного порядка
const getOriginalIndex = (reverseIndex: number): number => {
  return props.prizeLevels.length - 1 - reverseIndex
}

// Разворачиваем для отображения сверху вниз (самый большой приз внизу)
const reversedPrizeLevels = computed(() => {
  return [...props.prizeLevels].reverse()
})
</script>

<style scoped>
.prize-ladder {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 10px 0;
  border: 1px solid #ffd700;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ffd700 #1a1f2e;
}

.prize-ladder::-webkit-scrollbar {
  width: 6px;
}

.prize-ladder::-webkit-scrollbar-track {
  background: #1a1f2e;
  border-radius: 3px;
}

.prize-ladder::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 3px;
}

.prize-step {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  text-align: center;
  font-size: 16px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  font-weight: 500;
}

.prize-step:last-child {
  border-bottom: none;
}

/* Текущий вопрос */
.prize-step.current {
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.4));
  font-weight: bold;
  font-size: 18px;
  color: #ffd700;
}

/* Пройденные вопросы */
.prize-step.passed {
  color: #4caf50;
  text-shadow: 0 0 3px rgba(76, 175, 80, 0.5);
}

/* Несгораемые суммы */
.prize-step.milestone {
  color: #ffffff;
  font-weight: bold;
}

.prize-star {
  font-size: 12px;
  opacity: 0.8;
  color: #ffd700;
}

.prize-step.milestone .prize-star {
  opacity: 1;
  text-shadow: 0 0 3px #ffd700;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .prize-ladder {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .prize-ladder {
    display: none;
  }
}
</style>
