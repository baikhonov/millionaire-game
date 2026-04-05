<template>
  <div class="winners-modal" @click.self="close">
    <div class="winners-container">
      <div class="confetti-bg"></div>

      <div class="winners-header">
        <div class="trophy-icon">🏆</div>
        <h1>Поздравляем победителей!</h1>
      </div>

      <div class="winners-grid">
        <!-- Победитель 1: Лев -->
        <div class="winner-card winner-2">
          <div class="winner-photo">
            <img src="/images/winners/lev.jpg" alt="Лев" @error="handleImageError" />
            <div class="photo-glow"></div>
          </div>
          <div class="winner-info">
            <h2>Лев</h2>
            <div class="winner-prize">
              <span class="prize-icon">💰</span>
              <span class="prize-amount">32 000</span>
              <span class="prize-currency">бачатакоинов</span>
            </div>
            <div class="winner-badge">
              <span class="badge-icon">⭐</span>
              <span>Игрок 1</span>
            </div>
          </div>
          <div class="crown">👑</div>
        </div>
        <!-- Победитель 2: Ксения -->
        <div class="winner-card winner-1">
          <div class="winner-photo">
            <img src="/images/winners/ksenia.jpg" alt="Ксения" @error="handleImageError" />
            <div class="photo-glow"></div>
          </div>
          <div class="winner-info">
            <h2>Ксения</h2>
            <div class="winner-prize">
              <span class="prize-icon">💰</span>
              <span class="prize-amount">32 000</span>
              <span class="prize-currency">бачатакоинов</span>
            </div>
            <div class="winner-badge">
              <span class="badge-icon">⭐</span>
              <span>Игрок 2</span>
            </div>
          </div>
          <div class="crown">👑</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
}>()

const close = () => {
  emit('close')
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/images/default-avatar.webp'
}
</script>

<style scoped>
.winners-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.winners-container {
  position: relative;
  background: linear-gradient(135deg, #1a1f2e, #0f1420);
  border: 3px solid #ffd700;
  border-radius: 30px;
  padding: 40px;
  max-width: 1000px;
  width: 90%;
  text-align: center;
  animation: slideUp 0.4s ease;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
}

.confetti-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at top, rgba(255, 215, 0, 0.1), transparent);
  pointer-events: none;
  border-radius: 27px;
}

.winners-header {
  margin-bottom: 40px;
}

.trophy-icon {
  font-size: 60px;
  animation: bounce 1s ease infinite;
}

.winners-header h1 {
  color: #ffd700;
  font-size: 36px;
  margin-top: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.subtitle {
  color: #ccc;
  font-size: 16px;
  margin-top: 10px;
}

.winners-grid {
  display: flex;
  gap: 40px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
}

.winner-card {
  position: relative;
  background: linear-gradient(135deg, #2a2f3e, #1a1f2e);
  border-radius: 20px;
  padding: 30px 20px;
  width: 320px;
  text-align: center;
  transition: all 0.3s;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.winner-card:hover {
  transform: translateY(-10px);
  border-color: #ffd700;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.winner-1 {
  animation: slideInLeft 0.5s ease;
}

.winner-2 {
  animation: slideInRight 0.5s ease;
}

.winner-photo {
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto 20px;
}

.winner-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.photo-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.2), transparent);
  animation: pulse 2s ease infinite;
}

.winner-info h2 {
  color: #ffd700;
  font-size: 28px;
  margin-bottom: 15px;
}

.winner-prize {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
  margin-bottom: 15px;
}

.prize-icon {
  font-size: 20px;
}

.prize-amount {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
}

.prize-currency {
  font-size: 14px;
  color: #ccc;
}

.winner-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 215, 0, 0.2);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: #ffd700;
}

.crown {
  position: absolute;
  top: -20px;
  right: 20px;
  font-size: 40px;
  animation: float 2s ease infinite;
}

.winners-footer {
  border-top: 1px solid rgba(255, 215, 0, 0.3);
  padding-top: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.total-prize {
  background: rgba(255, 215, 0, 0.1);
  padding: 12px 24px;
  border-radius: 40px;
}

.total-label {
  color: #ccc;
  margin-right: 10px;
}

.total-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
}

.close-button {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #0a0f1e;
  border: none;
  border-radius: 40px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.close-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@media (max-width: 768px) {
  .winners-container {
    padding: 20px;
  }

  .winners-header h1 {
    font-size: 24px;
  }

  .winner-card {
    width: 100%;
    max-width: 280px;
  }

  .prize-amount {
    font-size: 24px;
  }

  .total-amount {
    font-size: 18px;
  }
}
</style>
