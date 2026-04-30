<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import ProductCard from '@/components/products/ProductCard.vue'
import type { IProduct } from '@/types/Product'
import { productService } from '@/services/productService'
import apiClient from '@/services/apiClient'
import { useRoute, useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const route = useRoute()
const products = ref<IProduct[]>([])
const brands = ref<any[]>([])
const categories = ref<any[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const lastPage = ref(1)
const totalItems = ref(0)

const activeProducts = computed(() => {
  return products.value.filter((product) => product.is_active === true)
})

const filters = ref({
  category_id: '' as string | number, // '' nghĩa là Tất cả
  brand_id: '' as string | number,
  min_price: '',
  max_price: '',
  is_active: 'true',
  sort_by: route.query.sort_by || 'newest',
  search: '',
})

const fetchProducts = async () => {
  const min = filters.value.min_price
  const max = filters.value.max_price
  if ((min !== '' && Number(min) < 0) || (max !== '' && Number(max) < 0)) {
    Swal.fire({
      icon: 'warning',
      title: 'Giá tiền không hợp lệ',
      text: 'Giá tiền không được nhỏ hơn 0',
    })
  }
  if ((min !== '' && Number(min.length) > 11) || (max !== '' && Number(max.length) > 11)) {
    Swal.fire({ icon: 'warning', title: 'Giá tiền không hợp lệ', text: 'Giá tiền quá lớn' })
  }
  isLoading.value = true
  try {
    // Loại bỏ các giá trị rỗng trước khi gửi
    const params: any = {}
    params.page = currentPage.value
    params.limit = 12
    if (filters.value.is_active) params.is_active = filters.value.is_active
    if (filters.value.category_id) params.category_id = filters.value.category_id
    if (filters.value.brand_id) params.brand_id = filters.value.brand_id
    if (filters.value.min_price) params.min_price = filters.value.min_price
    if (filters.value.max_price) params.max_price = filters.value.max_price
    if (filters.value.search) params.search = filters.value.search

    if (filters.value.sort_by) {
      params.sort_by = filters.value.sort_by
    }

    const result = await productService.getProducts(params)
    products.value = result.data
    if (result.meta) {
      lastPage.value = result.meta.last_page
      totalItems.value = result.meta.total
    }
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error)
  } finally {
    isLoading.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    category_id: '',
    brand_id: '',
    min_price: '',
    max_price: '',
    is_active: '',
    sort_by: 'newest',
    search: '',
  }
  currentPage.value = 1

  fetchProducts()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page
    fetchProducts() // Gọi lại API với trang mới

    // Cuộn lên đầu danh sách sản phẩm cho trải nghiệm tốt hơn
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const fetchInitialData = async () => {
  try {
    const [brandsRes, categoriesRes] = await Promise.all([
      apiClient.get('/brands'),
      apiClient.get('/categories'),
    ])
    brands.value = brandsRes.data
    categories.value = categoriesRes.data
  } catch (error) {
    console.error('Lỗi tải bộ lọc:', error)
  }
}

const pages = computed(() => {
  const pagesArray = []
  // Hiển thị 5 nút xung quanh trang hiện tại
  let startPage = Math.max(1, currentPage.value - 2)
  let endPage = Math.min(lastPage.value, currentPage.value + 2)

  if (startPage === 1) {
    endPage = Math.min(lastPage.value, 5)
  }
  if (endPage === lastPage.value) {
    startPage = Math.max(1, lastPage.value - 4)
  }

  for (let i = startPage; i <= endPage; i++) {
    pagesArray.push(i)
  }
  return pagesArray
})

const handlePriceInput = (field: 'min_price' | 'max_price', event: Event) => {
  const target = event.target as HTMLInputElement

  let value = target.value.replace(/\D/g, '')

  if (value.length > 11) {
    value = value.slice(0, 11)
  }
  target.value = value

  filters.value[field] = value
}
defineExpose({ fetchProducts, resetFilters })
onMounted(() => {
  fetchInitialData()
  fetchProducts()
})

watch(
  () => [
    filters.value.category_id,
    filters.value.brand_id,
    filters.value.search,
    filters.value.sort_by,
  ],
  () => {
    currentPage.value = 1
    fetchProducts()
  },
)
</script>

<template>
  <div class="product-list-page container py-4">
    <h3 class="mb-4 fw-bold">Bộ lọc</h3>

    <div class="card p-3 mb-4 shadow-sm">
      <div class="row g-3 align-items-end justify-content-between">
        <div class="col-6 col-md-3 col-lg-2 flex-fill">
          <label class="form-label fw-bold small text-muted">Danh Mục:</label>
          <select class="form-select" v-model="filters.category_id">
            <option value="">Tất cả</option>
            <option v-for="cat in categories" :key="cat.category_id" :value="cat.category_id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="col-6 col-md-3 col-lg-2 flex-fill">
          <label class="form-label fw-bold small text-muted">Thương Hiệu:</label>
          <select class="form-select" v-model="filters.brand_id">
            <option value="">Tất cả</option>
            <option v-for="brand in brands" :key="brand.brand_id" :value="brand.brand_id">
              {{ brand.name }}
            </option>
          </select>
        </div>

        <div class="col-md-6 col-lg-3 flex-fill">
          <label class="form-label fw-bold small text-muted">Khoảng Giá:</label>
          <div class="input-group input-group-sm customPrice">
            <input
              type="text"
              inputmode="numeric"
              class="form-control form-control-sm"
              :value="filters.min_price"
              @input="handlePriceInput('min_price', $event)"
              placeholder="0"
              @keydown.down.prevent
              @keydown.minus.prevent
              min="0"
              maxlength="11"
            />
            <span class="input-group-text">-</span>
            <input
              type="text"
              inputmode="numeric"
              class="form-control form-control-sm"
              :value="filters.max_price"
              @input="handlePriceInput('max_price', $event)"
              placeholder="Không giới hạn"
              maxlength="11"
              min="1"
              @keydown.down.prevent
              @keydown.minus.prevent
            />
          </div>
        </div>

        <div class="col-md-6 col-lg-2 d-flex gap-2">
          <button class="btn btn-primary flex-fill" @click="fetchProducts" :disabled="isLoading">
            Áp dụng
          </button>
          <button
            class="btn btn-outline-secondary flex-fill"
            @click="resetFilters"
            :disabled="isLoading"
          >
            Đặt lại
          </button>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0">Kết quả ({{ totalItems }} sản phẩm)</h5>
      <div class="d-flex align-items-center">
        <span class="me-2 text-nowrap">Sắp xếp:</span>
        <select v-model="filters.sort_by" class="form-select form-select-sm" style="width: 150px">
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-2 text-muted">Đang tải sản phẩm...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else-if="activeProducts.length === 0" class="alert alert-info text-center">
      Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
    </div>

    <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
      <div class="col" v-for="product in activeProducts" :key="product.product_id">
        <ProductCard :product="product" />
      </div>
    </div>

    <div v-if="lastPage > 1 && !isLoading" class="d-flex justify-content-center mt-5">
      <nav aria-label="Phân trang sản phẩm">
        <ul class="pagination shadow-sm">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Trước</a>
          </li>

          <li v-if="pages[0]! > 1" class="page-item">
            <a class="page-link" href="#" @click.prevent="changePage(1)">1</a>
          </li>
          <li v-if="pages[0]! > 2" class="page-item disabled">
            <span class="page-link">...</span>
          </li>

          <li
            class="page-item"
            v-for="page in pages"
            :key="page"
            :class="{ active: page === currentPage }"
          >
            <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
          </li>

          <li v-if="pages[pages.length - 1]! < lastPage - 1" class="page-item disabled">
            <span class="page-link">...</span>
          </li>
          <li v-if="pages[pages.length - 1]! < lastPage" class="page-item">
            <a class="page-link" href="#" @click.prevent="changePage(lastPage)">{{ lastPage }}</a>
          </li>

          <li class="page-item" :class="{ disabled: currentPage === lastPage }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Sau</a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
<style>
.customPrice input {
  height: 38px;
}
</style>
