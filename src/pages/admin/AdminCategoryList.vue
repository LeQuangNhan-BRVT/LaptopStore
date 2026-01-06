<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { categoryService } from '@/services/categoryService'
import type { ICategories } from '@/types/Category'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const category = ref<ICategories[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const newCategoryName = ref('')
const newCateDescription = ref('')
const isSubmitting = ref(false)

const fetchCategories = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    category.value = await categoryService.getCategories()
  } catch (error) {
    console.error('Lỗi khi tải danh mục', error)
    errorMessage.value = 'Lỗi khi tải danh mục nhu cầu'
  } finally {
    isLoading.value = false
  }
}

const handleAddCategory = async () => {
  try {
    await categoryService.createCategory(newCategoryName.value, newCateDescription.value)
    newCategoryName.value = ''
    newCateDescription.value = ''
    await fetchCategories()
  } catch (error: any) {
    console.error('Lỗi khi thêm danh mục:', error)
    errorMessage.value = error.response?.data?.message || 'Thêm danh mục thất bại.'
  } finally {
    isSubmitting.value = false
  }
}
const handleDelete = async (id: number) => {
  if (!confirm('Bạn có chắc muốn xóa sản phẩm này không?')) {
    return
  }
  try {
    await categoryService.deleteCategory(id)
    alert('Xóa thành công')
    window.location.reload()
  } catch (error: any) {
    console.error('Lỗi khi xóa', error)
    alert(error.response?.data?.message || 'Xóa thất bại')
  }
}
onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="card shadow-sm mb-4">
    <div class="card-body" v-if="authStore.isAdmin">
      <h5 class="card-title">Thêm danh mục</h5>

      <form @submit.prevent="handleAddCategory">
        <div class="mb-3">
          <label for="categoryName" class="form-label"
            >Tên danh mục <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            id="categoryName"
            v-model="newCategoryName"
            placeholder="Nhập tên danh mục..."
            required
          />
        </div>

        <div class="mb-3">
          <label for="categoryDesc" class="form-label">Mô tả (Tùy chọn)</label>
          <textarea
            class="form-control"
            id="categoryDesc"
            v-model="newCateDescription"
            rows="3"
            placeholder="Mô tả ngắn về danh mục..."
          ></textarea>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
          <span velse>Thêm</span>
        </button>
      </form>
    </div>
  </div>

  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title">Danh sách đang hoạt động</h5>

      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <table v-else class="table table-hover align-middle">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Tên danh mục</th>
            <th scope="col">Mô tả</th>
            <th scope="col">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cate in category" :key="cate.category_id">
            <th scope="row">{{ cate.category_id }}</th>
            <td>{{ cate.name }}</td>
            <td>{{ cate.description }}</td>
            <td v-if="authStore.isAdmin">
              <button
                class="btn btn-danger btn-sm"
                v-if="authStore.isAdmin"
                @click="handleDelete(cate.category_id)"
              >
                <i class="bi bi-trash-fill"></i> Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-if="!isLoading && category.length === 0" class="text-muted">Chưa có danh mục nào.</p>
    </div>
  </div>
</template>
