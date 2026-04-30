<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productService } from '@/services/productService'
import apiClient from '@/services/apiClient'
import { useAuthStore } from '@/store/auth'
import Swal from 'sweetalert2'

const router = useRouter()
const authStore = useAuthStore()

// Form data
const sku = ref('')
const tag = ref('')
const name = ref('')
const brand_id = ref<number | null>(null)
const category_id = ref<number | null>(null)
const price = ref(0)
const sale_price = ref<number | null>(null)
const quantity = ref(0)
const description = ref('')
const is_active = ref(true)

// Dropdowns data
const brands = ref<any[]>([])
const categories = ref<any[]>([])

// File upload
const selectedFile = ref<File | null>(null)
const errorMessage = ref<string | null>(null)
const isLoading = ref(false)

const ensureAdmin = async () => {
  console.log('--- [Debug] ensureAdmin() BẮT ĐẦU ---')

  if (!authStore.token) {
    Swal.fire('Lỗi', 'Bạn không có quyền thực hiện hành động này', 'error')
  }

  if (!authStore.user) {
    try {
      await authStore.fetchUserProfile()
    } catch (error: any) {
      console.error('LỖI: fetchUserProfile() thất bại:', error.response?.data || error.message)
      router.push({ name: 'admin-login', query: { redirect: '/admin/products/new' } })
      return false
    }
  }

  if (!authStore.isAdmin) {
    Swal.fire('Lỗi', 'Bạn không có quyền thực hiện hành động này', 'error')
  }
  return true
}

onMounted(async () => {
  console.log('--- [Debug] onMounted() BẮT ĐẦU ---')
  const ok = await ensureAdmin()
  if (!ok) {
    console.warn('[Debug] onMounted() BỊ DỪNG bởi ensureAdmin.')
    Swal.fire('Lỗi', 'Bạn không có quyền thực hiện hành động này', 'error')
  }

  console.log('[Debug] onMounted() Tải brands và categories...')
  try {
    const [brandsRes, categoriesRes] = await Promise.all([
      apiClient.get('/brands'),
      apiClient.get('/categories'),
    ])
    brands.value = brandsRes.data
    categories.value = categoriesRes.data
    console.log('[Debug] onMounted() Tải brands/categories THÀNH CÔNG.')
  } catch (error) {
    console.error('Lỗi khi tải brands/categories:', error)
    errorMessage.value = 'Không thể tải dữ liệu brands/categories.'
  }
})

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file) {
      selectedFile.value = file
    }
  }
}

const handleSubmit = async () => {
  errorMessage.value = null

  const ok = await ensureAdmin()
  if (!ok) {
    console.error('[Debug] handleSubmit() BỊ DỪNG bởi ensureAdmin.')
    return
  }

  if (!selectedFile.value) {
    errorMessage.value = 'Vui lòng chọn một hình ảnh sản phẩm.'
    return
  }
  if (!sku.value || !name.value || !brand_id.value || !category_id.value || price.value <= 0) {
    errorMessage.value = 'Vui lòng điền đầy đủ thông tin bắt buộc.'
    return
  }

  isLoading.value = true

  const formData = new FormData()
  formData.append('sku', sku.value.trim())
  formData.append('name', name.value.trim())
  formData.append('brand_id', brand_id.value!.toString())
  formData.append('category_id', category_id.value!.toString())
  formData.append('price', price.value.toString().trim())
  if (sale_price.value) {
    formData.append('sale_price', sale_price.value.toString().trim())
  }
  formData.append('quantity', quantity.value.toString().trim())
  if (description.value) {
    formData.append('description', description.value.trim())
  }
  if (tag.value) {
    const tagsArray = tag.value
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    tagsArray.forEach((t) => formData.append('tags', t))
  }
  formData.append('is_active', is_active.value.toString())
  formData.append('image', selectedFile.value)

  try {
    await productService.createProduct(formData)
    router.push('/admin/products')
  } catch (error: any) {
    console.error('[Debug] Response của lỗi:', error.response)
    console.error('[Debug] Data của response (NestJS):', error.response?.data)

    const errorMsg =
      error.response?.data?.message || error.response?.data?.error || 'Tạo sản phẩm thất bại.'
    if (Array.isArray(error.response?.data?.message)) {
      errorMessage.value = error.response.data.message.join(', ')
    } else {
      errorMessage.value = errorMsg
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div >
    <h1 class="mb-4" >Thêm Sản Phẩm Mới</h1>

    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <form @submit.prevent="handleSubmit" class="card shadow-sm">
      <div class="card-body p-4">
        <div class="row g-3">
          <div class="col-md-8">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="sku" class="form-label">SKU <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="sku" v-model="sku" required />
              </div>
              <div class="col-md-6 mb-3">
                <label for="name" class="form-label"
                  >Tên Sản Phẩm <span class="text-danger">*</span></label
                >
                <input type="text" class="form-control" id="name" v-model="name" required />
              </div>
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="brand_id" class="form-label"
                  >Thương Hiệu <span class="text-danger">*</span></label
                >
                <select class="form-select" id="brand_id" v-model="brand_id" required>
                  <option value="">-- Chọn thương hiệu --</option>
                  <option v-for="brand in brands" :key="brand.brand_id" :value="brand.brand_id">
                    {{ brand.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label for="category_id" class="form-label"
                  >Danh Mục <span class="text-danger">*</span></label
                >
                <select class="form-select" id="category_id" v-model="category_id" required>
                  <option value="">-- Chọn danh mục theo nhu cầu --</option>
                  <option
                    v-for="category in categories"
                    :key="category.category_id"
                    :value="category.category_id"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="price" class="form-label"
                  >Giá (VND) <span class="text-danger">*</span></label
                >
                <input
                  type="number"
                  class="form-control"
                  id="price"
                  v-model.number="price"
                  min="0"
                  required
                />
              </div>
              <div class="col-md-4 mb-3">
                <label for="sale_price" class="form-label">Giá Khuyến Mãi (VND)</label>
                <input
                  type="number"
                  class="form-control"
                  id="sale_price"
                  v-model.number="sale_price"
                  min="0"
                />
              </div>
              <div class="col-md-4 mb-3">
                <label for="quantity" class="form-label"
                  >Số Lượng <span class="text-danger">*</span></label
                >
                <input
                  type="number"
                  class="form-control"
                  id="quantity"
                  v-model.number="quantity"
                  min="0"
                  required
                />
              </div>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">Mô Tả</label>
              <textarea
                class="form-control"
                id="description"
                v-model="description"
                rows="4"
              ></textarea>
            </div>
            <div class="col-md-6 mb-3">
              <label for="tag" class="form-label">Gắn thẻ <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="tag" v-model="tag" required />
            </div>

            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="is_active"
                  v-model="is_active"
                />
                <label class="form-check-label" for="is_active"> Kích hoạt sản phẩm </label>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <label for="image" class="form-label"
              >Ảnh Đại Diện <span class="text-danger">*</span></label
            >
            <input
              type="file"
              class="form-control"
              id="image"
              @change="handleFileChange"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              required
            />
            <div v-if="selectedFile" class="mt-2">
              <small class="text-muted">Đã chọn: {{ selectedFile.name }}</small>
            </div>
          </div>
        </div>

        <hr class="my-4" />
        <div class="d-flex justify-content-end gap-2">
          <button
            type="button"
            class="btn btn-secondary"
            @click="router.push('/admin/products')"
            :disabled="isLoading"
          >
            Hủy
          </button>
          <button type="submit" class="btn btn-primary btn-lg" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            <span v-else>Lưu Sản Phẩm</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
