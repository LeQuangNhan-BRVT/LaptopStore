<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient from '@/services/apiClient'
import ProductCard from '@/components/products/ProductCard.vue'
import type { IProduct } from '@/types/Product'
const route = useRoute()
const router = useRouter()

const products = ref<IProduct[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const lastPage = ref(1)

const filters = ref({
  keyword: route.query.q || '',
  max_price: route.query.max_price || '',
  min_price: route.query.min_price || '',
  sort_by: route.query.sort_by || 'newest',
  ram: route.query.ram || '',
  cpu: route.query.cpu || '',
  storage: route.query.storage || '',
})
const changePage = (page: number) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page
    fetchProducts() // Gọi lại API với trang mới

    // Cuộn lên đầu danh sách sản phẩm cho trải nghiệm tốt hơn
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const formatFilter = (val: any) => (Array.isArray(val) ? val.join(',') : val)

    const params = {
      keyword: filters.value.keyword,
      min_price: filters.value.min_price,
      max_price: filters.value.max_price,
      sort_by: filters.value.sort_by,
      ram: formatFilter(filters.value.ram),
      cpu: formatFilter(filters.value.cpu),
      storage: formatFilter(filters.value.storage),

      // 👇 QUAN TRỌNG 1: Phải gửi trang hiện tại lên Backend
      page: currentPage.value, 
      limit: 12 // (Tùy chọn) Gửi kèm limit để chắc chắn đồng bộ
    }

    const res = await apiClient.get('/products/search', { params })

    products.value = res.data.data
    total.value = res.data.meta.total
    
    // 👇 QUAN TRỌNG 2: Phải cập nhật lastPage thì v-if mới hiện
    lastPage.value = res.data.meta.last_page 
    
    // Cập nhật lại currentPage từ backend trả về để đảm bảo đồng bộ
    currentPage.value = Number(res.data.meta.page)

  } catch (error) {
    console.error('Lỗi tải ds sản phẩm:', error)
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  // Reset về trang 1 khi lọc
  currentPage.value = 1; 

  const formatQuery = (val: any) =>
    Array.isArray(val) && val.length > 0 ? val.join(',') : undefined

  router.push({
    path: '/search',
    query: {
      q: filters.value.keyword || undefined,
      min_price: filters.value.min_price || undefined,
      max_price: filters.value.max_price || undefined,
      sort_by: filters.value.sort_by,
      ram: formatQuery(filters.value.ram),
      cpu: formatQuery(filters.value.cpu),
      storage: formatQuery(filters.value.storage),
      
    },
  })
}

watch(
  () => route.query,
  (newQuery) => {
    ((filters.value.keyword = newQuery.q as string|| ''),
    (filters.value.min_price = newQuery.min_price || ''))
    filters.value.max_price = newQuery.max_price || ''
    filters.value.sort_by = newQuery.sort_by || 'newest'
    filters.value.ram = newQuery.ram || ''
    filters.value.storage = newQuery.storage || ''

    // Đọc từ URL (chuỗi "8GB,16GB") chuyển ngược lại thành Mảng ['8GB', '16GB'] để checkbox hiểu
    filters.value.ram = newQuery.ram ? (newQuery.ram as string).split(',') : []
    filters.value.cpu = newQuery.cpu ? (newQuery.cpu as string).split(',') : []
    filters.value.storage = newQuery.storage ? (newQuery.storage as string).split(',') : []
    currentPage.value = 1
    fetchProducts()
  },
  { immediate: true },
)
</script>
<template>
  <div class="container py-4">
    <div class="row">
      <div class="col-md-3 mb-4">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white fw-bold">Bộ lọc tìm kiếm</div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label fw-bold small">Khoảng giá</label>
              <div class="d-flex gap-2 mb-2">
                <input
                  v-model="filters.min_price"
                  type="number"
                  class="form-control form-control-sm"
                  placeholder="Min"
                  @change="applyFilter"
                />
                <input
                  v-model="filters.max_price"
                  type="number"
                  class="form-control form-control-sm"
                  placeholder="Max"
                  @change="applyFilter"
                />
              </div>
            </div>

            <div class="mb-3">
              <label class="fw-bold small">Vi xử lý (CPU)</label>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="Core i3"
                  v-model="filters.cpu"
                  @change="applyFilter"
                />
                <label class="form-check-label">Intel Core i3</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="Core i5"
                  v-model="filters.cpu"
                  @change="applyFilter"
                />
                <label class="form-check-label">Intel Core i5</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="Core i7"
                  v-model="filters.cpu"
                  @change="applyFilter"
                />
                <label class="form-check-label">Intel Core i7</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="Core Ultra"
                  v-model="filters.cpu"
                  @change="applyFilter"
                />
                <label class="form-check-label">Intel Core Ultra</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="Ryzen 5"
                  v-model="filters.cpu"
                  @change="applyFilter"
                />
                <label class="form-check-label">AMD Ryzen 5</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="Ryzen 7"
                  v-model="filters.cpu"
                  @change="applyFilter"
                />
                <label class="form-check-label">AMD Ryzen 7</label>
              </div>
            </div>

            <div class="mb-3">
              <label class="fw-bold small">RAM</label>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="8GB"
                  v-model="filters.ram"
                  @change="applyFilter"
                />
                <label class="form-check-label">8 GB</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="16GB"
                  v-model="filters.ram"
                  @change="applyFilter"
                />
                <label class="form-check-label">16 GB</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="32GB"
                  v-model="filters.ram"
                  @change="applyFilter"
                />
                <label class="form-check-label">32 GB</label>
              </div>
            </div>

            <div class="mb-3">
              <label class="fw-bold small">Bộ nhớ trong</label>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="256GB"
                  v-model="filters.storage"
                  @change="applyFilter"
                />
                <label class="form-check-label">256 GB</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="512GB"
                  v-model="filters.storage"
                  @change="applyFilter"
                />
                <label class="form-check-label">512 GB</label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  value="1TB"
                  v-model="filters.storage"
                  @change="applyFilter"
                />
                <label class="form-check-label">1TB</label>
              </div>
            </div>

            <button class="btn btn-outline-secondary btn-sm w-100" @click="router.push('/search')">
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      <div class="col-md-9">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0">
            Kết quả: <span class="text-primary">"{{ filters.keyword }}"</span>
            <small class="text-muted fs-6 ms-2">({{ total }} sản phẩm)</small>
          </h4>

          <div class="d-flex align-items-center">
            <span class="me-2 text-nowrap">Sắp xếp:</span>
            <select
              v-model="filters.sort_by"
              class="form-select form-select-sm"
              @change="applyFilter"
              style="width: 150px"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else-if="products.length === 0" class="text-center py-5 bg-light rounded">
          <i class="bi bi-search fs-1 text-muted"></i>
          <p class="mt-3">Không tìm thấy sản phẩm nào phù hợp.</p>
        </div>

        <div v-else class="row row-cols-1 row-cols-md-3 g-4">
          <div class="col" v-for="product in products" :key="product.product_id">
            <ProductCard :product="product" />
          </div>
        </div>
        <div v-if="lastPage > 1" class="d-flex justify-content-center mt-5">
          <nav aria-label="Page navigation">
            <ul class="pagination">
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
      </div>
    </div>
  </div>
</template>
