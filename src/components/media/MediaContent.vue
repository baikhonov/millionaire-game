<template>
  <div class="media-content">
    <!-- Изображение -->
    <div v-if="media.type === 'image'" class="media-image">
      <img
        :src="getFullUrl(media.url)"
        @error="handleImageError"
        @click="showLightbox = true"
        style="cursor: pointer"
      />
      <!-- Lightbox для изображений -->
      <VueEasyLightbox
        :visible="showLightbox"
        :imgs="getFullUrl(media.url)"
        @hide="showLightbox = false"
      />
    </div>

    <!-- Аудио -->
    <div v-else-if="media.type === 'audio'" class="media-audio">
      <audio
        controls
        :src="getFullUrl(media.url)"
        @play="onMediaPlay"
        @error="handleAudioError"
        class="audio-player"
      >
        Ваш браузер не поддерживает аудио
      </audio>
    </div>

    <!-- Видео -->
    <div v-else-if="media.type === 'video'" class="media-video">
      <video
        controls
        :src="getFullUrl(media.url)"
        @play="onMediaPlay"
        @error="handleVideoError"
        class="video-player"
      >
        Ваш браузер не поддерживает видео
      </video>
    </div>

    <!-- Если тип не поддерживается -->
    <div v-else class="media-error">⚠️ Неподдерживаемый тип медиа</div>
  </div>
</template>

<script setup lang="ts">
import type { MediaContent } from '@/types/game'
import { ref } from 'vue'
import { BASE_URL } from '@/config'
import VueEasyLightbox from 'vue-easy-lightbox'
import { useSoundManager } from '@/composables/useSoundManager'

const props = defineProps<{
  media: MediaContent
}>()

const showLightbox = ref(false)
const soundManager = useSoundManager()

// Функция, вызываемая при начале воспроизведения медиа
const onMediaPlay = () => {
  // Останавливаем фоновую музыку
  soundManager.stopMusic()
  // Останавливаем все звуковые эффекты (подсказки, выбор ответа и т.д.)
  soundManager.stopAllEffects()
}

// Функция для корректного формирования URL с учётом BASE_URL
const getFullUrl = (url: string): string => {
  // Если это уже полный URL (http, https), возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Убираем лишний слеш в начале, если есть
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url
  return `${BASE_URL}${cleanUrl}`
}

const handleImageError = () => {
  console.error(`Не удалось загрузить изображение: ${props.media.url}`)
}

const handleAudioError = () => {
  console.error(`Не удалось загрузить аудио: ${props.media.url}`)
}

const handleVideoError = () => {
  console.error(`Не удалось загрузить видео: ${props.media.url}`)
}
</script>

<style scoped>
.media-content {
  margin: 20px 0 0;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

.media-image {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.media-image img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 12px;
  cursor: pointer;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.media-image img:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  border-color: #ffd700;
}

.media-audio {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

/* Стили для аудиоплеера — светлые */
.audio-player {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  outline: none;
}

/* Для WebKit (Chrome, Safari) — делаем ползунки яркими */
.audio-player::-webkit-media-controls-panel {
  background-color: #2c2c2c;
}

.audio-player::-webkit-media-controls-play-button,
.audio-player::-webkit-media-controls-mute-button {
  background-color: #ffd700;
  border-radius: 50%;
  color: #000;
}

.audio-player::-webkit-media-controls-current-time-display,
.audio-player::-webkit-media-controls-time-remaining-display {
  color: #ffd700;
  text-shadow: none;
}

.audio-player::-webkit-media-controls-timeline {
  background-color: #555;
  border-radius: 5px;
}

.audio-player::-webkit-media-controls-volume-slider {
  background-color: #555;
  border-radius: 5px;
}

/* Для Firefox */
.audio-player::-moz-range-track {
  background-color: #ffd700;
}

.media-video {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-player {
  width: 100%;
  max-width: 800px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.media-caption {
  margin-top: 12px;
  font-size: 14px;
  color: #ffd700;
  font-style: italic;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.media-error {
  padding: 40px;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  color: #ff6b6b;
  font-size: 16px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .media-image img {
    max-height: 250px;
  }

  .video-player {
    max-width: 100%;
  }

  .audio-player {
    max-width: 100%;
  }
}
</style>
