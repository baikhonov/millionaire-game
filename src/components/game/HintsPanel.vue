<template>
  <div class="hints-panel">
    <button
      class="hint-btn hint-fifty"
      :class="{ used: usedHints.fiftyFifty }"
      :disabled="usedHints.fiftyFifty || disabled"
      @click="$emit('fiftyFifty')"
    >
      <span class="hint-icon">🎲</span>
      <span class="hint-text">50:50</span>
    </button>

    <button
      v-if="!showTimerButton"
      class="hint-btn hint-call"
      :class="{ used: usedHints.call }"
      :disabled="usedHints.call || disabled"
      @click="$emit('call')"
    >
      <span class="hint-icon">📞</span>
      <span class="hint-text">Звонок другу</span>
    </button>

    <!-- Кнопка таймера (вместо звонка) -->
    <button v-else class="hint-btn hint-timer" @click="$emit('startTimer')">
      <span class="hint-icon">⏱️</span>
      <span class="hint-text">Таймер</span>
    </button>

    <button
      class="hint-btn hint-audience"
      :class="{ used: usedHints.audience }"
      :disabled="usedHints.audience || disabled"
      @click="$emit('audience')"
    >
      <span class="hint-icon">👥</span>
      <span class="hint-text">Помощь зала</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  usedHints: {
    fiftyFifty: boolean
    call: boolean
    audience: boolean
  }
  disabled: boolean
  showTimerButton: boolean
}>()

defineEmits<{
  (e: 'fiftyFifty'): void
  (e: 'call'): void
  (e: 'audience'): void
  (e: 'startTimer'): void
}>()
</script>

<style scoped>
.hints-panel {
  position: relative;

  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 10px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.hint-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid #ffd700;
  border-radius: 30px;
  background: linear-gradient(135deg, #1a1f2e, #0f1420);
  color: #ffd700;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.hint-icon {
  font-size: 16px;
}

.hint-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(255, 215, 0, 0.2);
  background: linear-gradient(135deg, #2a2f3e, #1f2430);
}

.hint-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint-btn.used {
  opacity: 0.5;
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border-color: #666;
  transform: none;
}

.hint-timer {
  background: linear-gradient(135deg, #2a5f3e, #1a3f2e);
  border-color: #4caf50;
}

.hint-timer:hover:not(:disabled) {
  background: linear-gradient(135deg, #3a7f4e, #2a5f3e);
}

/* Адаптивность */
@media (max-width: 900px) {
  .hints-panel {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;

    padding: 15px 20px;
  }

  .hint-btn {
    width: auto;
    min-width: 100px;
    padding: 6px 12px;
  }
}

@media (max-width: 768px) {
  .hint-text {
    display: none;
  }

  .hint-btn {
    min-width: 40px;
    padding: 8px;
  }

  .hint-icon {
    font-size: 18px;
    margin: 0;
  }
}
</style>
