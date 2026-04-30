<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { productService } from '@/services/productService'
import apiClient from '@/services/apiClient'
import ProductCard from '@/components/products/ProductCard.vue'
import type { IProduct } from '@/types/Product'
import { useRoute } from 'vue-router'
import Swal from 'sweetalert2'

// Dữ liệu
const products = ref<IProduct[]>([])
const brands = ref<any[]>([])
const categories = ref<any[]>([])
const isLoading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)
const route = useRoute()
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

// Hàm tải dữ liệu ban đầu (Brands, Categories)
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

// Hàm tải sản phẩm (có áp dụng lọc)
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

// Hàm reset bộ lọc
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

  fetchProducts() // Tải lại tất cả
}

const handlePriceInput = (field: 'min_price' | 'max_price', event: Event) => {
  const target = event.target as HTMLInputElement

  let value = target.value.replace(/\D/g, '')

  if (value.length > 11) {
    value = value.slice(0, 11)
  }
  target.value = value

  filters.value[field] = value
}
// Tải dữ liệu khi trang mở
onMounted(() => {
  fetchInitialData()
  fetchProducts()
})
const changePage = (page: number) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page
    fetchProducts() // Gọi lại API với trang mới

    // Cuộn lên đầu danh sách sản phẩm cho trải nghiệm tốt hơn
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

watch(
  () => [
    filters.value.category_id,
    filters.value.brand_id,
    filters.value.is_active,
    filters.value.sort_by,
  ],
  () => {
    currentPage.value = 1
    fetchProducts()
  },
)
</script>

<template>
  <div class="home-page">
    <div class="container-fluid">
      <div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="true">
        <div class="carousel-indicators">
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="0"
            class="active"
            aria-current="true"
            aria-label="Slide 1"
          ></button>
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="1"
            aria-label="Slide 2"
          ></button>
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="2"
            aria-label="Slide 3"
          ></button>
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="3"
            aria-label="Slide 4"
          ></button>
          <button
            type="button"
            data-bs-target="#carouselExampleIndicators"
            data-bs-slide-to="4"
            aria-label="Slide 5"
          ></button>
        </div>
        <div class="carousel-inner container-fluid">
          <div class="carousel-item active">
            <img src="/images/banner.png" class="d-block w-100" alt="banner" />
          </div>
          <div class="carousel-item">
            <img src="/images/banner1.png" class="d-block w-100" alt="banner1" />
          </div>
          <div class="carousel-item">
            <img src="/images/banner2.png" class="d-block w-100" alt="banner2" />
          </div>
          <div class="carousel-item">
            <img src="/images/banner3.png" class="d-block w-100" alt="banner3" />
          </div>
          <div class="carousel-item">
            <img src="/images/banner4.png" class="d-block w-100" alt="banner4" />
          </div>
        </div>
        <button
          class="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleIndicators"
          data-bs-slide="prev"
        >
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Previous</span>
        </button>
        <button
          class="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleIndicators"
          data-bs-slide="next"
        >
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Next</span>
        </button>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-3 mb-4">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom-0 pt-3">
            <h5 class="fw-bold"><i class="bi bi-funnel-fill"></i> Bộ Lọc</h5>
          </div>
          <div class="card-body">
            <div class="mb-4">
              <h6 class="fw-bold">Danh Mục</h6>
              <div class="list-group">
                <button
                  type="button"
                  class="list-group-item list-group-item-action border-0"
                  :class="{ active: filters.category_id === '' }"
                  @click="filters.category_id = ''"
                >
                  Tất cả
                </button>
                <button
                  v-for="cat in categories"
                  :key="cat.category_id"
                  type="button"
                  class="list-group-item list-group-item-action border-0"
                  :class="{ active: filters.category_id === cat.category_id }"
                  @click="filters.category_id = cat.category_id"
                >
                  {{ cat.name }}
                </button>
              </div>
            </div>

            <div class="mb-4">
              <h6 class="fw-bold">Thương Hiệu</h6>
              <select class="form-select" v-model="filters.brand_id">
                <option value="">Tất cả thương hiệu</option>
                <option v-for="brand in brands" :key="brand.brand_id" :value="brand.brand_id">
                  {{ brand.name }}
                </option>
              </select>
            </div>

            <div class="mb-4">
              <h6 class="fw-bold">Khoảng Giá</h6>
              <div class="mb-2">
                <label class="form-label small text-muted">Từ:</label>
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
              </div>
              <div class="mb-2">
                <label class="form-label small text-muted">Đến:</label>
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

            <div class="d-grid gap-2">
              <button class="btn btn-primary btn-sm" @click="fetchProducts">Áp dụng</button>
              <button class="btn btn-outline-secondary btn-sm" @click="resetFilters">
                Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-9">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0">Danh Sách Sản Phẩm</h3>
          <div class="d-flex align-items-center">
            <span class="me-2 text-nowrap">Sắp xếp:</span>
            <select
              v-model="filters.sort_by"
              class="form-select form-select-sm"
              style="width: 150px"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else-if="products.length === 0" class="text-center py-5 bg-light rounded">
          <i class="bi bi-search fs-1 text-muted"></i>
          <p class="mt-3 text-muted">Không tìm thấy sản phẩm nào phù hợp.</p>
          <button class="btn btn-primary mt-2" @click="resetFilters">Xóa bộ lọc</button>
        </div>

        <div v-else class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          <div class="col" v-for="product in activeProducts" :key="product.product_id">
            <ProductCard :product="product" />
          </div>
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
  <div class="floating-contacts">
    <a
      href="https://zalo.me/0337570400"
      target="_blank"
      class="contact-btn zalo-btn"
      title="Chat Zalo"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="currentColor"
        viewBox="0 0 512 512"
      >
        <path
          d="M256 0a256 256 0 1 0 256 256A256 256 0 0 0 256 0zM224 384l-64 32 32-64H96a32 32 0 0 1-32-32V128a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v192a32 32 0 0 1-32 32z"
        />
      </svg>
    </a>

    <a
      href="https://m.me/lequangnhanbrvt"
      target="_blank"
      class="contact-btn messenger-btn"
      title="Chat Messenger"
    >
      <i class="bi bi-messenger"></i>
    </a>

    <a href="tel:0337570400" class="contact-btn hotline-btn" title="Gọi Hotline">
      <i class="bi bi-telephone-fill"></i>
    </a>
  </div>
</template>

<style scoped>
.carousel-inner img {
  max-height: 450px;
  object-fit: cover;
  object-position: center;
}

.list-group-item.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  border-radius: 0.25rem;
}

.floating-contacts {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000; /* Đảm bảo luôn nổi trên các thành phần khác */
  display: flex;
  flex-direction: column;
  gap: 10px; /* Khoảng cách giữa các nút */
}

.contact-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  text-decoration: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.contact-btn:hover {
  transform: scale(1.1); /* Phóng to nhẹ khi hover */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

/* Màu sắc đặc trưng cho từng ứng dụng */
.zalo-btn {
  background-color: #0068ff;
}

.messenger-btn {
  background-color: #0084ff;
}

.hotline-btn {
  background-color: #dc3545; /* Màu đỏ nổi bật */
  animation: pulse 1.5s infinite; /* Hiệu ứng nhịp đập thu hút sự chú ý */
}

/* Hiệu ứng nhịp đập */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
}
</style>
