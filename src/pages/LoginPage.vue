<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const email = ref('')
const password = ref('')
const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(false)

// Xử lý đăng nhập Local
const handleLocalLogin = async () => {
  if (!email.value || !password.value) {
    Swal.fire('Cảnh báo', 'Vui lòng nhập đầy đủ Email và Mật khẩu', 'warning')
    return
  }

  isLoading.value = true
  try {
    await authStore.handleUserLogin({ email: email.value, password: password.value })
    router.push('/')
  } catch (error: any) {
    Swal.fire({
      icon: 'error',
      title: 'Đăng nhập thất bại',
      text: error.message,
      confirmButtonText: 'Thử lại',
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container mt-5" style="max-width: 500px">
    <div class="card shadow p-4">
      <h3 class="text-center mb-4 text-primary">Đăng Nhập</h3>

      <form @submit.prevent="handleLocalLogin">
        <div class="mb-3">
          <label class="form-label fw-bold">Email</label>
          <input
            type="email"
            class="form-control"
            v-model="email"
            required
            placeholder="Nhập email của bạn"
          />
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold">Mật khẩu</label>
          <input
            type="password"
            class="form-control"
            v-model="password"
            required
            placeholder="Nhập mật khẩu..."
          />
        </div>

        <button type="submit" class="btn btn-primary w-100 fw-bold" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
          {{ isLoading ? 'Đang xử lý...' : 'Đăng Nhập' }}
        </button>
      </form>

      <div class="mt-3 d-flex justify-content-between">
        <RouterLink to="/forgot-password" class="text-decoration-none small text-primary">
          Quên mật khẩu?
        </RouterLink>
        <RouterLink to="/register" class="text-decoration-none small">
          Đăng ký tài khoản mới
        </RouterLink>
      </div>

      <hr />
      <h5 class="text-center fs-6 text-muted mb-3">Hoặc đăng nhập với</h5>

      <div class="d-grid gap-2">
        <a href="http://localhost:3000/auth/google" class="btn btn-outline-danger">
          <i class="bi bi-google me-2"></i> Google
        </a>
      </div>
    </div>
  </div>
</template>
