<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const email = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter() // Dùng để điều hướng

const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    await authStore.handleAdminLogin({
      email: email.value,
      password: password.value,
    })

    if (authStore.isAdmin) {
      router.push('/admin/products')
    } else {
      router.push('/admin/orders')
    }
  } catch (error: any) {
    // 3. Nếu thất bại, hiển thị lỗi
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
  console.log('dữ liệu gửi đi: ', email, password)
}
</script>

<template>
  <div class="login-container d-flex justify-content-center align-items-center vh-100 bg-light">
    <div class="card shadow" style="width: 400px">
      <div class="card-body p-5">
        <h3 class="card-title text-center mb-4">Đăng Nhập Admin</h3>

        <form @submit.prevent="handleSubmit">
          <div v-if="errorMessage" class="alert alert-danger">
            {{ errorMessage }}
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" class="form-control" id="email" v-model="email" required />
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Mật khẩu</label>
            <input type="password" class="form-control" id="password" v-model="password" required />
          </div>

          <button type="submit" class="btn btn-primary w-100" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status"></span>
            <span vN-else>Đăng Nhập</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
