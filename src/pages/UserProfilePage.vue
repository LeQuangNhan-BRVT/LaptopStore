<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/authService';

const authStore = useAuthStore();
const user = ref<any>({});
const isLoading = ref(false);
const message = ref('');

onMounted(() => {
  // Copy dữ liệu từ store ra biến cục bộ để sửa
  if (authStore.user) {
    user.value = { ...authStore.user };
  }
});

const handleUpdate = async () => {
  isLoading.value = true;
  message.value = '';
  try {
    const updatedUser = await authService.updateProfile({
      full_name: user.value.full_name,
      phone_number: user.value.phone_number,
      address: user.value.address,
    });

    // Cập nhật lại store
    authStore.user = updatedUser;
    message.value = 'Cập nhật thành công!';
  } catch (error) {
    message.value = 'Có lỗi xảy ra.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="container py-5">
    <h2 class="mb-4">Hồ sơ cá nhân</h2>

    <div v-if="message" class="alert alert-info">{{ message }}</div>

    <form @submit.prevent="handleUpdate" class="card p-4 shadow-sm" style="max-width: 600px">
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="text" class="form-control" :value="user.email" disabled readonly>
        <small class="text-muted">Không thể thay đổi email.</small>
      </div>

      <div class="mb-3">
        <label class="form-label">Họ và tên</label>
        <input type="text" class="form-control" v-model="user.full_name" required>
      </div>

      <div class="mb-3">
        <label class="form-label">Số điện thoại</label>
        <input type="text" class="form-control" v-model="user.phone_number">
      </div>

      <div class="mb-3">
        <label class="form-label">Địa chỉ mặc định</label>
        <textarea class="form-control" v-model="user.address" rows="3"></textarea>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        {{ isLoading ? 'Đang lưu...' : 'Lưu thay đổi' }}
      </button>
    </form>
  </div>
</template>