<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const phoneNumber = ref('')

const errorMessage = ref<string | null>(null)
const isLoadingLocal = ref(false) // Trạng thái loading cho đăng ký local

const authStore = useAuthStore()
const router = useRouter()

// Xử lý đăng ký bằng email/password
const handleLocalRegister = async () => {
  errorMessage.value = null
  isLoadingLocal.value = true

  // Chuẩn hoá dữ liệu
  const trimmedEmail = email.value.trim().toLowerCase()
  const trimmedFullName = fullName.value.trim()
  const trimmedPhone = phoneNumber.value.trim()

  // Validate cơ bản phía client
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const fullnameRegex = /^[\p{L}\s]+$/u
  if (!trimmedFullName) {
    errorMessage.value = 'Họ và tên là bắt buộc.'
    isLoadingLocal.value = false
    return
  }
  if (!fullnameRegex.test(trimmedFullName)) {
    errorMessage.value = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng.'
    isLoadingLocal.value = false
    return
  }
  if (!emailRegex.test(trimmedEmail)) {
    errorMessage.value = 'Email không hợp lệ.'
    isLoadingLocal.value = false
    return
  }
  if (password.value.length < 6) {
    errorMessage.value = 'Mật khẩu phải có ít nhất 6 ký tự.'
    isLoadingLocal.value = false
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu và xác nhận mật khẩu không khớp.'
    isLoadingLocal.value = false
    return
  }
  if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
    errorMessage.value = 'Số điện thoại không hợp lệ, phải là 10 chữ số.'
    isLoadingLocal.value = false
    return
  }

  try {
    await authStore.handleRegister({
      email: trimmedEmail,
      password: password.value,
      full_name: trimmedFullName,
      phone_number: trimmedPhone || undefined,
    })
    // Nếu thành công, chuyển hướng về trang chủ
    router.push('/')
  } catch (error: any) {
    errorMessage.value = error.message || 'Đăng ký thất bại. Vui lòng thử lại.'
  } finally {
    isLoadingLocal.value = false
  }
}

// Hàm điều hướng đến Google/Facebook (Backend sẽ xử lý redirect)
const loginWithGoogle = () => {
  window.location.href = 'http://localhost:3000/auth/google'
}
</script>

<template>
  <div class="register-container d-flex justify-content-center align-items-center my-5">
    <div class="card shadow" style="width: 500px">
      <div class="card-body p-5">
        <h3 class="card-title text-center mb-4">Tạo Tài Khoản Mới</h3>

        <div v-if="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLocalRegister">
          <div class="mb-3">
            <label for="fullName" class="form-label"
              >Họ và Tên <span class="text-danger">*</span></label
            >
            <input
              type="text"
              class="form-control"
              id="fullName"
              v-model="fullName"
              minlength="3"
              required
            />
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
            <input type="email" class="form-control" id="email" v-model="email" required />
          </div>
          <div class="mb-3">
            <label for="phoneNumber" class="form-label">Số điện thoại</label>
            <input
              type="tel"
              class="form-control"
              id="phoneNumber"
              v-model="phoneNumber"
              size="10"
            />
          </div>
          <div class="mb-3">
            <label for="password" class="form-label"
              >Mật khẩu <span class="text-danger">*</span></label
            >
            <input type="password" class="form-control" id="password" v-model="password" required />
          </div>
          <div class="mb-4">
            <label for="confirmPassword" class="form-label"
              >Xác nhận mật khẩu <span class="text-danger">*</span></label
            >
            <input
              type="password"
              class="form-control"
              id="confirmPassword"
              v-model="confirmPassword"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="isLoadingLocal">
            <span
              v-if="isLoadingLocal"
              class="spinner-border spinner-border-sm"
              role="status"
            ></span>
            <span v-else>Đăng Ký</span>
          </button>
        </form>

        <hr class="my-4" />
        <h5 class="text-center mb-3">Hoặc đăng ký/đăng nhập với</h5>

        <div class="d-grid gap-2">
          <button class="btn btn-outline-danger" @click="loginWithGoogle">
            <i class="bi bi-google me-2"></i> Tiếp tục với Google
          </button>
          <!-- Đã gỡ Facebook -->
        </div>

        <p class="text-center mt-3">
          Đã có tài khoản? <RouterLink to="/login">Đăng nhập ngay</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: calc(100vh - 140px); /* Adjust based on header/footer height */
}
</style>
