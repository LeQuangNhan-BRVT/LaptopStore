<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { IProduct } from '@/types/Product'
import { productService } from '@/services/productService'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { useCompareStore } from '@/store/compare'
import Swal from 'sweetalert2'

const product = ref<IProduct | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const route = useRoute()
const selectedImage = ref<string | undefined>('')
const compareStore = useCompareStore()

const cartStore = useCartStore()
const quantity = ref(1)
const router = useRouter()
const authStore = useAuthStore()

const fetchProductBySlug = async (id: number) => {
  isLoading.value = true
  error.value = null
  try {
    const slug = route.params.slug as string
    product.value = await productService.getProductBySlug(slug)
  } catch (err: any) {
    console.error('Lỗi khi tải sản phẩm:', err)
    error.value = err.response?.data?.message || 'Không tìm thấy sản phẩm này!'
  } finally {
    isLoading.value = false
  }
}
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

onMounted(async () => {
  try {
    const slug = route.params.slug as string
    const data = await productService.getProductBySlug(slug)
    product.value = data
    if (data.images && data.images.length > 0) {
      const primary = data.images.find((img) => img.is_primary)
      selectedImage.value = primary ? primary.image_url : data.images[0]?.image_url
    }
  } catch (err) {
    error.value = 'Không tìm thấy sản phẩm hoặc có lỗi'
  } finally {
    isLoading.value = false
  }
})
const changeImage = (url: string) => {
  selectedImage.value = url
}

//gio hang
const handleAddToCart = () => {
  if (!authStore.isAuthenticated) {
    Swal.fire('Lỗi', 'Vui lòng đăng nhập!')
    return
  }
  if (authStore.isAdmin || authStore.isStaff) {
    Swal.fire('Tài khoản quản trị không được thực hiện hành động này!')
    return
  }
  if (product.value) {
    cartStore.addToCart(product.value, quantity.value)
  }
}
const handleCheckout = () => {
  if (!authStore.isAuthenticated) {
    Swal.fire('Lỗi', 'Vui lòng đăng nhập!')
    router.push('/login')
    return
  }
  if (authStore.isAdmin || authStore.isStaff) {
    Swal.fire('Tài khoản quản trị không được thực hiện hành động này!')
    return
  }
  if (product.value) {
    const isAvailable = cartStore.checkQuantity(product.value, quantity.value)
    if (isAvailable) {
      cartStore.clearCart()
      cartStore.addToCart(product.value, quantity.value)
      router.push('/checkout')
    }
  }
}
</script>

<template>
  <div class="container md-5 mb-5">
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else-if="error" class="alert alert-danger text-center">
      {{ error }}
    </div>

    <div v-else-if="product" class="row">
      <div class="col-md-6">
        <div
          class="main-image-container mb-3 border rounded p-2 d-flex align-items-center justify-content-center"
        >
          <img :src="selectedImage" class="img-fluid main-img" :alt="product.name" />
        </div>

        <div class="d-flex gap-2 overflow-auto">
          <div
            v-for="img in product.images"
            :key="img.image_id"
            class="thumb-box border rounded p-1"
            :class="{ 'border-primary': selectedImage === img.image_url }"
            @click="changeImage(img.image_url)"
            style="cursor: pointer"
          >
            <img :src="img.image_url" class="thumb-img" alt="thumbnail" />
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <h2 class="fw-bold">{{ product.name }}</h2>

        <div class="text-muted mb-3">
          <span class="badge bg-info me-2" v-if="product.brand">{{ product.brand.name }}</span>
          <span class="badge bg-secondary" v-if="product.category">{{
            product.category.name
          }}</span>
          <span class="ms-2">Mã SP: {{ product.sku }}</span>
        </div>

        <div class="price-box mb-4">
          <h3 class="text-danger fw-bold mb-0">
            {{ formatCurrency(product.sale_price || product.price) }}
          </h3>
          <div v-if="product.sale_price" class="text-muted text-decoration-line-through">
            {{ formatCurrency(product.price) }}
          </div>
        </div>

        <div class="specs-box bg-light p-3 rounded mb-4" v-if="product.specification">
          <h5>Cấu hình nổi bật:</h5>
          <ul class="list-unstyled mb-0">
            <li>
              <i class="bi bi-cpu me-2"></i> <strong>CPU:</strong> {{ product.specification.cpu }}
            </li>
            <li>
              <i class="bi bi-memory me-2"></i> <strong>RAM:</strong>
              {{ product.specification.ram }}
            </li>
            <li>
              <i class="bi bi-hdd me-2"></i> <strong>Ổ cứng:</strong>
              {{ product.specification.storage }}
            </li>
            <li>
              <i class="bi bi-gpu-card me-2"></i> <strong>VGA:</strong>
              {{ product.specification.gpu }}
            </li>
            <li>
              <i class="bi bi-display me-2"></i> <strong>Màn hình:</strong>
              {{ product.specification.screen }}
            </li>
          </ul>
        </div>
        <div v-else class="alert alert-warning py-2">
          <small>Chưa cập nhật thông số kỹ thuật chi tiết.</small>
        </div>

        <div class="d-flex align-items-center mb-3">
          <label class="me-2">Số lượng:</label>
          <input
            type="number"
            class="form-control"
            v-model.number="quantity"
            min="1"
            style="width: 80px"
          />
        </div>
        <div class="d-flex gap-3">
          <button class="btn btn-primary btn-lg flex-grow-1" @click="handleAddToCart">
            <i class="bi bi-cart-plus"></i> Thêm vào giỏ
          </button>
          <button
            class="btn btn-lg"
            :class="
              compareStore.hasItem(product.product_id) ? 'btn-danger' : 'btn-outline-secondary'
            "
            @click="compareStore.toggleProduct(product)"
          >
            <i
              class="bi"
              :class="compareStore.hasItem(product.product_id) ? 'bi-x-lg' : 'bi-arrow-left-right'"
            ></i>
            {{ compareStore.hasItem(product.product_id) ? 'Bỏ so sánh' : 'So sánh' }}
          </button>
          <button class="btn btn-danger btn-lg flex-grow-1" @click="handleCheckout">
            Mua Ngay
          </button>
        </div>

        <div class="mt-5">
          <h5 class="border-bottom pb-2">Mô tả sản phẩm</h5>
          <p class="text-justify" style="white-space: pre-line">
            {{ product.description || 'Đang cập nhật...' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-image-container {
  height: 400px;
  background-color: white;
}
.main-img {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}
.thumb-box {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-box:hover {
  border-color: #0d6efd !important;
}
</style>
