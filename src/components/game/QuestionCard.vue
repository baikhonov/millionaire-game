<template>
  <div class="question-card">
    <div class="question-text">
      {{ question.text }}
    </div>

    <!-- Медиа контент -->
    <MediaContent v-if="question.media" :media="question.media" />
  </div>
</template>

<script setup lang="ts">
import type { Question } from '@/types/game'
import MediaContent from '@/components/media/MediaContent.vue'

defineProps<{
  question: Question
}>()
</script>

<style scoped>
.question-card {
  background: linear-gradient(135deg, rgba(10, 15, 30, 0.9) 0%, rgba(5, 8, 20, 0.95) 100%);
  border: 2px solid #ffd700;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.question-text {
  font-size: 40px;
  font-weight: bold;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .question-card {
    padding: 10px 15px;
    margin-bottom: 20px;
  }

  .question-text {
    font-size: 20px;
  }
}
</style>
