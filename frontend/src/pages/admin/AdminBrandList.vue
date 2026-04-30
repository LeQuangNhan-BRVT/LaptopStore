<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { brandService } from '@/services/brandService'
import type { IBrand } from '@/types/Brand'
import { useAuthStore } from '@/store/auth'
import Swal from 'sweetalert2'

const authStore = useAuthStore()
const brands = ref<IBrand[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const newBrandName = ref('')
const isSubmitting = ref(false)
const selectedLogoFile = ref<File | null>(null)

const fetchBrands = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    brands.value = await brandService.getBrands()
  } catch (error) {
    console.error('Lỗi khi tải danh sách thương hiệu', error)
    errorMessage.value = 'Lỗi khi tải danh sách thương hiệu'
  } finally {
    isLoading.value = false
  }
}
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file) {
      selectedLogoFile.value = file
    }
  }
}
//them moi brand
const handleAddBrand = async () => {
  if (newBrandName.value.trim() === '') {
    errorMessage.value = 'Tên thương hiệu không được để trống'
    return
  }
  if (!selectedLogoFile.value) {
    errorMessage.value = 'Logo là bắt buộc'
    return
  }
  isSubmitting.value = true
  errorMessage.value = null
  const formData = new FormData()
  formData.append('name', newBrandName.value)
  if (selectedLogoFile.value) {
    formData.append('logo', selectedLogoFile.value) //logo la ten ben Interceptor
  }
  try {
    await brandService.createBrand(formData)
    //reset form
    newBrandName.value = ''
    selectedLogoFile.value = null
    const fileInput = document.getElementById('logoInput') as HTMLInputElement
    if (fileInput) fileInput.value = ''
    await fetchBrands()
  } catch (error: any) {
    console.error('Lỗi khi thêm thương hiệu:', error)
    errorMessage.value = error.response?.data?.message || 'Thêm thương hiệu thất bại.'
  } finally {
    isSubmitting.value = false
  }
}
const handleDelete = async (id: number) => {
  try {
    await brandService.deleteBrand(id)
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Xóa thành công!',
      showConfirmButton: false,
      timer: 1000,
    })
    window.location.reload()
  } catch (error: any) {
    console.error('Lỗi khi xóa', error)
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: error.response?.data?.message || 'Xóa thất bại!',
    })
  }
}
onMounted(() => {
  fetchBrands()
})
</script>
<template>
  <div class="admin-brand-list">
    <h1 class="mb-4">Quản lý thương hiệu</h1>
    <div class="card shadow-sm mb-4">
      <div class="card-body" v-if="authStore.isAdmin">
        <h5 class="card-title">Thêm thương hiệu</h5>
        <form @submit.prevent="handleAddBrand">
          <div class="row g-3">
            <div class="col-md-6">
              <label for="brandName" class="form-label"
                >Tên thương hiệu <span class="text-danger">*</span></label
              >
              <input
                type="text"
                class="form-control"
                id="brandName"
                v-model="newBrandName"
                placeholder="Nhập tên thương hiệu..."
                required
              />
            </div>

            <div class="col-md-6">
              <label for="logoInput" class="form-label"
                >Logo <span class="text-danger">*</span></label
              >
              <input
                type="file"
                class="form-control"
                id="logoInput"
                @change="handleFileChange"
                accept="image/png,image/jpeg,image/webp"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary mt-3" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
            <span v-else>Thêm</span>
          </button>
        </form>
      </div>
    </div>
    <div class="card shadow-sm">
      <div class="card-body">
        <h5 class="card-title">Danh sách thương hiệu</h5>
        <div v-if="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
        <div v-if="isLoading" class="text-center">
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        <table v-else class="table table-hover align-middle">
          <thead>
            <tr>
              <th scope="col" style="width: 10%">ID</th>

              <th scope="col" style="width: 15%">Logo</th>

              <th scope="col">Tên thương hiệu</th>

              <th scope="col" style="width: 20%">Hành động</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="brand in brands" :key="brand.brand_id">
              <th scope="row">{{ brand.brand_id }}</th>

              <td>
                <img
                  v-if="brand.logo_url"
                  :src="brand.logo_url"
                  :alt="brand.name"
                  class="brand-logo-thumb"
                />
                <span v-else class="text-muted small">Không có logo</span>
              </td>

              <td>{{ brand.name }}</td>

              <td v-if="authStore.isAdmin">
                <button
                  class="btn btn-danger btn-sm"
                  v-if="authStore.isAdmin"
                  @click="handleDelete(brand.brand_id)"
                >
                  <i class="bi bi-trash-fill"></i> Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="!isLoading && brands.length === 0" class="text-muted">Chưa có thương hiệu nào</p>
      </div>
    </div>
  </div>
</template>
<style scoped>
.brand-logo-thumb {
  width: 60px;
  height: 60px;
  object-fit: contain; /* 'contain' tốt hơn 'cover' cho logo */
  border-radius: 4px;
  background-color: #f8f9fa; /* Thêm nền sáng cho logo trong suốt */
}
</style>
