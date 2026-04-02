<template>
  <Transition name="timer-slide">
    <div v-if="visible" class="timer-container">
      <div class="timer-card">
        <div class="timer-circle">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" class="timer-bg" />
            <circle
              cx="60"
              cy="60"
              r="52"
              class="timer-progress"
              :style="{ strokeDasharray: circumference, strokeDashoffset: progressOffset }"
              transform="rotate(180 60 60)"
            />
          </svg>
          <div class="timer-text">{{ formattedTime }}</div>
        </div>

        <button class="timer-stop-btn" @click="closeTimer">Завершить</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const visible = ref(false)
const timeLeft = ref(30)
let timerInterval: number | null = null

// Длина окружности: 2 * π * r = 2 * 3.14159 * 52 ≈ 326.73
const circumference = 2 * Math.PI * 52

const formattedTime = computed(() => {
  return `${timeLeft.value} сек`
})

const progressOffset = computed(() => {
  // Сколько процентов времени осталось
  const remainingPercent = timeLeft.value / 30
  // Полоса уменьшается по часовой стрелке
  // Начинаем с 0 смещения (полный круг), заканчиваем на circumference (пустой круг)
  return circumference * (1 - remainingPercent)
})

const start = () => {
  visible.value = true
  timeLeft.value = 30

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  timerInterval = window.setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    }

    if (timeLeft.value === 0) {
      stopTimer()
    }
  }, 1000)
}
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const closeTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  visible.value = false
  emit('complete')
}

defineExpose({ start, stopTimer, closeTimer })
</script>

<style scoped>
.timer-container {
  position: fixed;
  top: 95px;
  right: 20px;
  z-index: 150;
}

.timer-card {
  background: linear-gradient(135deg, #1a1f2e, #0f1420);
  border: 2px solid #ffd700;
  border-radius: 20px;
  padding: 15px;
  width: 180px;
  text-align: center;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  animation: timerPulse 1s ease;
}

.timer-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.timer-icon {
  font-size: 20px;
}

.timer-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.timer-circle {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 12px;
}

.timer-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg) scaleX(-1);
}

.timer-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 6;
}

.timer-progress {
  fill: none;
  stroke: #ffd700;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
}

.timer-stop-btn {
  background: linear-gradient(135deg, #c62828, #b71c1c);
  border: none;
  border-radius: 20px;
  padding: 6px 15px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.timer-stop-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 0 15px rgba(198, 40, 40, 0.5);
}

@keyframes timerPulse {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.timer-slide-enter-active {
  animation: slideIn 0.3s ease;
}

.timer-slide-leave-active {
  animation: slideOut 0.2s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(50px);
  }
}

@media (max-width: 768px) {
  .timer-container {
    top: 94px;
    right: 10px;
  }

  .timer-card {
    width: 150px;
    padding: 10px;
  }

  .timer-circle {
    width: 80px;
    height: 80px;
  }

  .timer-text {
    font-size: 16px;
  }
}
</style>
