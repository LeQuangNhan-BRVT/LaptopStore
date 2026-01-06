<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const token = route.query.token as string | undefined
  if (token) {
    try {
      await authStore.handleSocialLogin(token)
    } catch (e) {
      // Nếu có lỗi khi lấy profile, đưa về login kèm thông báo
      return router.replace({ path: '/login', query: { social_error: 'profile_failed' } })
    }
  }
  // Điều hướng về trang chủ (hoặc trang trước đó nếu muốn)
  router.replace('/')
})
</script>

<template>
  <div class="d-flex align-items-center justify-content-center my-5">
    <div class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Đang xử lý đăng nhập mạng xã hội...</p>
    </div>
  </div>
</template>
