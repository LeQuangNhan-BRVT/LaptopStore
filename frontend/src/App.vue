<script setup lang="ts">
import TheFooter from './components/layouts/TheFooter.vue'
import TheHeader from './components/layouts/TheHeader.vue'
import { onMounted } from 'vue';
import { useAuthStore } from './store/auth';
import CompareFloatingBar from './components/CompareFloatingBar.vue';

const authStore = useAuthStore();
onMounted(() => {
  authStore.fetchUserProfile();
})



</script>

<template>
  <TheHeader />
  <main class="main-content">
    <div class="container mt-4">
      <RouterView :key="$route.fullPath" />
    </div>
  </main>
  <TheFooter />
  <CompareFloatingBar />
</template>

<style>
.main-content {
  padding-top: 5px;
  min-height: calc(100vh - 150px);
}
</style>
