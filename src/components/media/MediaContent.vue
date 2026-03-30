<!-- src/components/media/MediaContent.vue -->
<template>
  <div class="media-content">
    <!-- Изображение -->
    <div v-if="media.type === 'image'" class="media-image">
      <img
        :src="media.url"
        :alt="media.caption || 'Изображение к вопросу'"
        @error="handleImageError"
        @click="openFullscreen"
      />
      <div v-if="media.caption" class="media-caption">{{ media.caption }}</div>
    </div>

    <!-- Аудио -->
    <div v-else-if="media.type === 'audio'" class="media-audio">
      <audio controls :src="media.url" @error="handleAudioError" class="audio-player">
        Ваш браузер не поддерживает аудио
      </audio>
      <div v-if="media.caption" class="media-caption">{{ media.caption }}</div>
    </div>

    <!-- Видео -->
    <div v-else-if="media.type === 'video'" class="media-video">
      <video
        controls
        :src="media.url"
        :poster="media.poster"
        @error="handleVideoError"
        class="video-player"
      >
        Ваш браузер не поддерживает видео
      </video>
      <div v-if="media.caption" class="media-caption">{{ media.caption }}</div>
    </div>

    <!-- Если тип не поддерживается -->
    <div v-else class="media-error">⚠️ Неподдерживаемый тип медиа</div>
  </div>
</template>

<script setup lang="ts">
import type { MediaContent } from '@/types/game'
import { ref } from 'vue'

const props = defineProps<{
  media: MediaContent
}>()

const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
  console.error(`Не удалось загрузить изображение: ${props.media.url}`)
}

const handleAudioError = () => {
  console.error(`Не удалось загрузить аудио: ${props.media.url}`)
}

const handleVideoError = () => {
  console.error(`Не удалось загрузить видео: ${props.media.url}`)
}

const openFullscreen = (event: MouseEvent) => {
  const img = event.target as HTMLImageElement
  if (img.requestFullscreen) {
    img.requestFullscreen()
  }
}
</script>

<style scoped>
.media-content {
  margin: 20px 0;
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
  max-height: 300px;
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

.audio-player {
  width: 100%;
  max-width: 500px;
  background: #1a1f2e;
  border-radius: 8px;
  outline: none;
}

.audio-player::-webkit-media-controls-panel {
  background: #1a1f2e;
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
