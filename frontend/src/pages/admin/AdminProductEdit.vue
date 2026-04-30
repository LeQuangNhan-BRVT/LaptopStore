<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { productService } from '@/services/productService'
import apiClient from '@/services/apiClient'
import { type IProductSpecification, type IProduct } from '@/types/Product' // Import IProduct
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute() // Dùng để lấy ID từ URL
const productId = Number(route.params.id)

// Dùng ref object để lưu dữ liệu sản phẩm
const product = ref<Partial<IProduct>>({}) // Dùng Partial để cho phép object rỗng
const tagsInput = ref('')

// Dropdowns data
const brands = ref<any[]>([])
const categories = ref<any[]>([])

// File upload (cho ảnh MỚI)
const newImages = ref<File[]>([])
const errorMessage = ref<string | null>(null)
const isLoading = ref(false)
const isLoadingImages = ref(false)

const productSpecs = ref<Partial<IProductSpecification>>({})

// 1. Tải dữ liệu (brands, categories, và SẢN PHẨM CŨ)
onMounted(async () => {
  isLoading.value = true
  try {
    const [brandsRes, categoriesRes, productRes] = await Promise.all([
      apiClient.get('/brands'),
      apiClient.get('/categories'),
      productService.getProductById(productId),
      productService.getSpecs(productId),
    ])

    brands.value = brandsRes.data
    categories.value = categoriesRes.data
    // 2. Đổ dữ liệu cũ vào form
    product.value = productRes
    if (productRes.product_tag && Array.isArray(productRes.product_tag)) {
      tagsInput.value = productRes.product_tag.map((t: any) => t.name).join(',')
    }
    try {
      const specsRes = await productService.getSpecs(productId)
      if (specsRes) {
        productSpecs.value = specsRes
      }
    } catch (e) {
      console.log('Sản phẩm chưa có thông số kỹ thuật (hoặc lỗi tải specs).')
    }
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu:', error)
    errorMessage.value = 'Không thể tải dữ liệu sản phẩm.'
  } finally {
    isLoading.value = false
  }
})

// 3. Xử lý cập nhật thông tin TEXT
const handleUpdateDetails = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    const tagsArray = tagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0) //loc rong
    const payload = {
      ...product.value,
      tags: tagsArray,
    }
    await productService.updateProduct(productId, payload)
    ;(await Swal.fire('Thành công', 'Đã cập nhật!')).dismiss
    router.push('/admin/products')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Cập nhật thất bại.'
  } finally {
    isLoading.value = false
  }
}
const handleUpdateSpecs = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    await productService.updateOrCreateSpecs(productId, productSpecs.value)
    alert('Cập nhật thông tin kỹ thuật thành công!')
    router.push('/admin/products')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Cập nhật thất bại.'
  } finally {
    isLoading.value = false
  }
}

// 4. Xử lý khi chọn file MỚI
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    newImages.value = Array.from(target.files)
  }
}

// 5. Xử lý tải ảnh MỚI
const handleUploadImages = async () => {
  if (newImages.value.length === 0) {
    errorMessage.value = 'Vui lòng chọn ít nhất một ảnh để tải lên.'
    return
  }

  isLoadingImages.value = true
  errorMessage.value = null

  const formData = new FormData()
  newImages.value.forEach((file) => {
    formData.append('images', file)
  })

  try {
    // Gọi API service mới
    await productService.addImages(productId, formData)

    // Tải lại dữ liệu sản phẩm để hiển thị ảnh mới
    const updatedProduct = await productService.getProductById(productId)
    product.value = updatedProduct
    newImages.value = [] // Xóa file đã chọn
    alert('Tải ảnh mới thành công!')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Tải ảnh thất bại.'
  } finally {
    isLoadingImages.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="mb-4">Chỉnh Sửa Sản Phẩm: {{ product.name || 'Đang tải...' }}</h1>

    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading && !product.name" class="text-center">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else>
      <form @submit.prevent="handleUpdateDetails" class="card shadow-sm mb-4">
        <div class="card-header">
          <h5>Thông tin cơ bản</h5>
        </div>
        <div class="card-body p-4">
          <div class="row g-3">
            <div class="col-md-8">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="sku" class="form-label">SKU</label>
                  <input type="text" class="form-control" id="sku" v-model="product.sku" />
                </div>
                <div class="col-md-6 mb-3">
                  <label for="name" class="form-label">Tên Sản Phẩm</label>
                  <input type="text" class="form-control" id="name" v-model="product.name" />
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="price" class="form-label">Giá</label>
                  <input type="text" class="form-control" id="price" v-model="product.price" />
                </div>
                <div class="col-md-6 mb-3">
                  <label for="sale_price" class="form-label">Giá khuyến mãi</label>
                  <input
                    type="text"
                    class="form-control"
                    id="sale_price"
                    v-model="product.sale_price"
                  />
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="quantity" class="form-label">Số lượng</label>
                  <input
                    type="text"
                    class="form-control"
                    id="quantity"
                    v-model="product.quantity"
                  />
                </div>
                <div class="col-md-6 mb-3">
                  <label for="description" class="form-label">Mô tả</label>
                  <textarea
                    class="form-control"
                    id="description"
                    v-model="product.description"
                    rows="4"
                  ></textarea>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="brand_id" class="form-label">Thương Hiệu</label>
                  <select class="form-select" id="brand_id" v-model="product.brand_id">
                    <option v-for="brand in brands" :key="brand.brand_id" :value="brand.brand_id">
                      {{ brand.name }}
                    </option>
                  </select>
                  <div class="mb-3">
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="is_active"
                        v-model="product.is_active"
                      />
                      <label class="form-check-label" for="is_active"> Kích hoạt sản phẩm </label>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="category_id" class="form-label">Danh Mục</label>
                  <select class="form-select" id="category_id" v-model="product.category_id">
                    <option
                      v-for="category in categories"
                      :key="category.category_id"
                      :value="category.category_id"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                </div>
                <div class="col-12 mb-3">
                  <label class="form-label fw-bold">Tags (Từ khóa tìm kiếm)</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-tags-fill"></i></span>
                    <input
                      type="text"
                      class="form-control"
                      v-model="tagsInput"
                      placeholder="VD: Gaming, Dell, Mỏng nhẹ (Nhập các từ khóa cách nhau bởi dấu phẩy)"
                    />
                  </div>
                  <div class="form-text">
                    Nhập các thẻ tags giúp sản phẩm dễ tìm kiếm và lọc hơn. Ví dụ: "Gaming, Văn
                    phòng, Pin trâu".
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr class="my-4" />
          <div class="d-flex justify-content-end">
            <button type="submit" class="btn btn-primary btn-lg" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
              Lưu Thay Đổi
            </button>
          </div>
        </div>
      </form>
      <form @submit.prevent="handleUpdateSpecs" class="card shadow-sm mb-4">
        <div class="card-header">
          <h5>Thông số kỹ thuật</h5>
        </div>
        <div class="card-body p-4">
          <div class="row g-3">
            <div class="col-md-6 mb-3">
              <label for="cpu" class="form-label">CPU</label>
              <input type="text" class="form-control" id="cpu" v-model="productSpecs.cpu" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="ram" class="form-label">RAM</label>
              <input type="text" class="form-control" id="ram" v-model="productSpecs.ram" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="storage" class="form-label">Ổ cứng</label>
              <input type="text" class="form-control" id="storage" v-model="productSpecs.storage" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="gpu" class="form-label">Card đồ họa (GPU)</label>
              <input type="text" class="form-control" id="gpu" v-model="productSpecs.gpu" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="pin" class="form-label">Pin</label>
              <input type="text" class="form-control" id="pin" v-model="productSpecs.pin" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="weight" class="form-label">Cân nặng</label>
              <input type="text" class="form-control" id="weight" v-model="productSpecs.weight" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="screen" class="form-label">Màn hình</label>
              <input type="text" class="form-control" id="screen" v-model="productSpecs.screen" />
            </div>
            <div class="col-md-6 mb-3">
              <label for="os" class="form-label">Hệ điều hành</label>
              <input type="text" class="form-control" id="os" v-model="productSpecs.os" />
            </div>
          </div>

          <hr class="my-4" />
          <div class="d-flex justify-content-end">
            <button type="submit" class="btn btn-info" :disabled="isLoading">
              <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
              Lưu Thông Số Kỹ Thuật
            </button>
          </div>
        </div>
      </form>
      <div class="card shadow-sm">
        <div class="card-header">
          <h5>Quản lý hình ảnh</h5>
        </div>
        <div class="card-body p-4">
          <h6>Các ảnh hiện tại</h6>
          <div v-if="product.images && product.images.length > 0" class="d-flex flex-wrap gap-2">
            <div v-for="image in product.images" :key="image.image_id" class="position-relative">
              <img
                :src="image.image_url"
                :alt="product.name"
                style="width: 100px; height: 100px; object-fit: cover"
                class="rounded"
              />
            </div>
          </div>
          <p v-else class="text-muted">Chưa có hình ảnh nào.</p>

          <hr />

          <h6>Thêm ảnh mới</h6>
          <form @submit.prevent="handleUploadImages">
            <div class="mb-3">
              <label for="newImages" class="form-label">Chọn một hoặc nhiều ảnh</label>
              <input
                type="file"
                class="form-control"
                id="newImages"
                @change="handleFileChange"
                multiple
                accept="image/png, image/jpeg"
              />
            </div>
            <button type="submit" class="btn btn-success" :disabled="isLoadingImages">
              <span v-if="isLoadingImages" class="spinner-border spinner-border-sm"></span>
              Tải Lên Ảnh Mới
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
