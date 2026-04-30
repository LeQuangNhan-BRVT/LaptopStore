<script setup lang="ts">
    import { ref } from 'vue';
    import apiClient from '@/services/apiClient';
    import Swal from 'sweetalert2';
    
    const email = ref('');
    const isLoading = ref(false);
    
    const handleForgot = async () => {
      try {
        isLoading.value = true;
        await apiClient.post('/auth/forgot-password', { email: email.value });
        Swal.fire('Thành công', 'Vui lòng kiểm tra email của bạn.', 'success');
      } catch (err: any) {
        Swal.fire('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra', 'error');
      } finally {
        isLoading.value = false;
      }
    };
    </script>
    
    <template>
      <div class="container py-5 d-flex justify-content-center">
        <div class="card shadow-sm p-4" style="max-width: 400px; width: 100%">
          <h3 class="text-center mb-3">Quên mật khẩu</h3>
          <p class="text-muted small text-center">Nhập email để nhận link đặt lại mật khẩu</p>
          <form @submit.prevent="handleForgot">
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" v-model="email" required placeholder="name@example.com">
            </div>
            <button class="btn btn-primary w-100" :disabled="isLoading">
              {{ isLoading ? 'Đang gửi...' : 'Gửi yêu cầu' }}
            </button>
          </form>
        </div>
      </div>
    </template>