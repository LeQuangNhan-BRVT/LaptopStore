<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { IProduct } from '@/types/Product'
import { productService } from '@/services/productService'
import { useAuthStore } from '@/store/auth'
import apiClient from '@/services/apiClient'
const router = useRouter()
const products = ref<IProduct[]>([])
const brands = ref<any[]>([])
const categories = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const authStore = useAuthStore()

const currentPage = ref(1)
const lastPage = ref(1)

const filters = ref({
  search: '',
  category_id: '' as string | number,
  brand_id: '' as string | number,
  is_active: '', // '' la lay tat ca
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

const fetchProducts = async () => {
  isLoading.value = true
  error.value = null
  try {
    const params: any = {}
    params.page = currentPage.value
    params.limit = 12
    if (filters.value.is_active) params.is_active = filters.value.is_active
    if (filters.value.category_id) params.category_id = filters.value.category_id
    if (filters.value.brand_id) params.brand_id = filters.value.brand_id
    if (filters.value.search && filters.value.search.trim() !== '') {
      params.keyword = filters.value.search.trim()
    }

    const result = await productService.getProducts(params)
    products.value = result.data
    if (result.meta) {
      lastPage.value = result.meta.last_page
    }
  } catch (err: any) {
    console.error(err)
    error.value = 'Không thể tải dữ liệu.'
  } finally {
    isLoading.value = false
  }
}

const handleFilter = () => {
  currentPage.value = 1
  fetchProducts()
}

const fetchInitialData = async () => {
  try {
    const [brandsRes, categoriesRes] = await Promise.all([
      apiClient.get('/brands'),
      apiClient.get('/categories'),
    ])
    brands.value = brandsRes.data
    categories.value = categoriesRes.data
    console.log('TH:', brands.value)
    console.log('DM:', categories.value)
  } catch (error) {
    console.error('Lỗi tải bộ lọc:', error)
  }
}

const resetFilter = () => {
  filters.value = {
    category_id: '',
    brand_id: '',
    is_active: '',
    search: '',
  }
  currentPage.value = 1

  fetchProducts()
}
const changePage = (page: number) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page
    fetchProducts()
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('Bạn có chắc muốn xóa sản phẩm này không?')) {
    return
  }
  try {
    await productService.deleteProduct(id)
    alert('Xóa thành công')
    fetchProducts()
  } catch (error: any) {
    console.error('Lỗi khi xóa', error)
    alert(error.response?.data?.message || 'Xóa thất bại')
  }
}
defineExpose({ fetchProducts, resetFilter })
onMounted(() => {
  fetchInitialData()
  fetchProducts()
})
watch(
  () => [filters.value.category_id, filters.value.brand_id, filters.value.is_active],
  () => {
    currentPage.value = 1
    fetchProducts()
  },
)
</script>
<template>
  <div class="admin-product-list">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Quản lý Sản phẩm</h1>
      <button
        v-if="authStore.isAdmin"
        class="btn btn-primary"
        @click="router.push('/admin/products/new')"
      >
        <i class="bi bi-plus-circle-fill me-2"></i>
        Thêm Sản phẩm mới
      </button>
    </div>

    <div class="card mb-4 shadow-sm bg-light">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <input
              type="text"
              class="form-control"
              placeholder="Tìm tên sản phẩm..."
              v-model="filters.search"
              @keyup.enter="handleFilter"
            />
          </div>

          <div class="col-md-2">
            <select class="form-select" v-model="filters.brand_id" @change="handleFilter">
              <option value="">Thương hiệu</option>
              <option v-for="b in brands" :key="b.brand_id" :value="b.brand_id">
                {{ b.name }}
              </option>
            </select>
          </div>

          <div class="col-md-2">
            <select class="form-select" v-model="filters.category_id" @change="handleFilter">
              <option value="">Danh mục</option>
              <option v-for="c in categories" :key="c.category_id" :value="c.category_id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <div class="col-md-2">
            <select class="form-select" v-model="filters.is_active" @change="handleFilter">
              <option value="">Trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã ẩn</option>
            </select>
          </div>

          <div class="col-md-3 d-flex gap-2">
            <button class="btn btn-primary w-100" @click="handleFilter">
              <i class="bi bi-search"></i> Tìm
            </button>
            <button class="btn btn-secondary w-50" @click="resetFilter">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>

    <div v-else class="card shadow-sm">
      <div class="card-body">
        <table class="table table-striped table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Ảnh</th>
              <th scope="col">Tên Sản phẩm</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Giá Gốc</th>
              <th scope="col">Giá Bán</th>
              <th scope="col">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.product_id">
              <th scope="row">{{ product.product_id }}</th>
              <td>
                <img
                  :src="product.primary_image || '/images/placeholder.png'"
                  :alt="product.name"
                  class="product-thumb border"
                />
              </td>
              <td>
                <div class="fw-bold">{{ product.name }}</div>
                <small class="text-muted">
                  {{ product.brand?.name }} - {{ product.category?.name }} - Số lượng còn lại:
                  <strong class="text-danger">{{ product.quantity }}</strong>
                </small>
              </td>
              <td>
                <span class="badge" :class="product.is_active ? 'bg-success' : 'bg-secondary'">
                  {{ product.is_active ? 'Hiện' : 'Ẩn' }}
                </span>
              </td>
              <td>{{ formatCurrency(product.price) }}</td>
              <td class="fw-bold text-danger">
                {{ formatCurrency(product.sale_price ?? product.price) }}
              </td>
              <td>
                <RouterLink
                  :to="`/admin/products/edit/${product.product_id}`"
                  class="btn btn-warning btn-sm me-2"
                >
                  <i class="bi bi-pencil-fill"></i>
                </RouterLink>
                <button
                  class="btn btn-danger btn-sm"
                  v-if="authStore.isAdmin"
                  @click="handleDelete(product.product_id)"
                >
                  <i class="bi bi-trash-fill"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="products.length > 0 && lastPage > 1" class="d-flex justify-content-center mt-4">
          <nav aria-label="Page navigation">
            <ul class="pagination mb-0">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <a
                  class="page-link"
                  href="#"
                  @click.prevent="changePage(currentPage - 1)"
                  aria-label="Previous"
                >
                  <span aria-hidden="true">&laquo;</span>
                </a>
              </li>

              <li
                v-for="page in lastPage"
                :key="page"
                class="page-item"
                :class="{ active: currentPage === page }"
              >
                <a class="page-link" href="#" @click.prevent="changePage(page)">
                  {{ page }}
                </a>
              </li>

              <li class="page-item" :class="{ disabled: currentPage === lastPage }">
                <a
                  class="page-link"
                  href="#"
                  @click.prevent="changePage(currentPage + 1)"
                  aria-label="Next"
                >
                  <span aria-hidden="true">&raquo;</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div v-if="products.length === 0 && !isLoading" class="text-center py-4 text-muted">
          Không tìm thấy sản phẩm nào phù hợp.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}
.page-link {
  cursor: pointer;
}
/* Style nhẹ cho ô input để nó đẹp hơn */
.form-select:focus,
.form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
  border-color: #86b7fe;
}
</style>
