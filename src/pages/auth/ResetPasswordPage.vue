<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/authService' // Import service vừa sửa
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

onMounted(() => {
  // Lấy token từ URL (query param)
  token.value = route.query.token as string

  if (!token.value) {
    Swal.fire('Lỗi', 'Đường dẫn không hợp lệ hoặc thiếu Token', 'error').then(() =>
      router.push('/login'),
    )
  }
})

const handleReset = async () => {
  if (password.value !== confirmPassword.value) {
    Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp', 'error')
    return
  }

  try {
    isLoading.value = true
    // Gọi Service gửi token và pass mới về Backend
    await authService.resetPassword(token.value, password.value)

    await Swal.fire('Thành công', 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.', 'success')
    router.push('/login')
  } catch (error: any) {
    Swal.fire(
      'Thất bại',
      error.response?.data?.message || 'Token hết hạn hoặc không hợp lệ',
      'error',
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container d-flex justify-content-center align-items-center" style="min-height: 80vh">
    <div class="card shadow p-4" style="width: 100%; max-width: 400px">
      <h3 class="text-center mb-4 text-primary">Đặt Lại Mật Khẩu</h3>

      <form @submit.prevent="handleReset">
        <div class="mb-3">
          <label class="form-label">Mật khẩu mới</label>
          <input type="password" class="form-control" v-model="password" required minlength="6" />
        </div>

        <div class="mb-3">
          <label class="form-label">Xác nhận mật khẩu</label>
          <input type="password" class="form-control" v-model="confirmPassword" required />
        </div>

        <button type="submit" class="btn btn-primary w-100" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
          Đổi mật khẩu
        </button>
      </form>
    </div>
  </div>
</template>
