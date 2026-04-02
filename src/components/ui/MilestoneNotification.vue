<template>
  <Transition name="milestone">
    <div v-if="visible" class="milestone-notification">
      <div class="milestone-content">
        <div class="milestone-icon">🏆</div>
        <div class="milestone-text">
          <div class="milestone-title">Гарантированный приз!</div>
          <div class="milestone-amount">{{ formatMoney(amount) }}</div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  formatMoney: (amount: number) => string
}>()

const visible = ref(false)
const amount = ref(0)

let timeoutId: number | null = null

const show = (prizeAmount: number) => {
  // Очищаем предыдущий таймер
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  amount.value = prizeAmount
  visible.value = true

  // Автоматически скрываем через 3 секунды
  timeoutId = window.setTimeout(() => {
    visible.value = false
  }, 8000)
}

defineExpose({ show })
</script>

<style scoped>
.milestone-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
  animation: milestoneIn 0.2s ease;
}

.milestone-content {
  background: linear-gradient(135deg, #1a3a6a, #0a1a3f);
  border: 3px solid #ffd700;
  border-radius: 20px;
  padding: 25px 40px;
  text-align: center;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.5);
  min-width: 350px;
}

.milestone-icon {
  font-size: 48px;
  margin-bottom: 10px;
  animation: bounce 0.5s ease;
}

.milestone-title {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.milestone-amount {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  margin-bottom: 10px;
}

.milestone-message {
  font-size: 14px;
  color: #ccc;
}

@keyframes milestoneIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@media (max-width: 768px) {
  .milestone-content {
    padding: 15px 25px;
    min-width: 280px;
  }

  .milestone-title {
    font-size: 18px;
  }

  .milestone-amount {
    font-size: 28px;
  }

  .milestone-icon {
    font-size: 36px;
  }
}
</style>
