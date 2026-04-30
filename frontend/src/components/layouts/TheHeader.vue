<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { productService } from '@/services/productService'
import type { IProduct } from '@/types/Product'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const { isAuthenticated, user, isAdmin, isStaff } = storeToRefs(authStore)
const { handleLogout } = authStore

const searchResults = ref<IProduct[]>([])
let lastRequestKeyword = ''

const isSearching = ref(false)
const showDropdown = ref(false)
const keyword = ref('')
const isUserDropdownOpen = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  const dropdownEl = document.getElementById('user-dropdown-wrapper')
  if (dropdownEl && !dropdownEl.contains(event.target as Node)) {
    isUserDropdownOpen.value = false
  }
}

const formatName = (fullName?: string | null) => {
  if (!fullName) return 'User'
  const parts = fullName.trim().split(' ')
  // Lấy tên cuối cùng hoặc 2 từ cuối
  return parts.length > 2 ? `${parts[parts.length - 2]} ${parts[parts.length - 1]}` : fullName
}

const clearSearch = () => {
  keyword.value = ''
  showDropdown.value = false
  searchResults.value = []
  isSearching.value = false
  if (searchTimeout) clearTimeout(searchTimeout)
}

const handleSearchInput = () => {
  const currentKeyword = keyword.value.trim()

  if (!currentKeyword) {
    clearSearch()
    return
  }

  showDropdown.value = true
  isSearching.value = true

  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    if (!currentKeyword) {
      isSearching.value = false
      return
    }
    lastRequestKeyword = keyword.value
    try {
      const results = await productService.getProducts({
        keyword: keyword.value,
        limit: 5,
        is_active: 'true',
      })
      if (keyword.value === lastRequestKeyword) {
        searchResults.value = results.data
      }
    } catch (error) {
      console.error(error)
    } finally {
      if (keyword.value === lastRequestKeyword) {
        isSearching.value = false
      }
    }
  }, 400)
}

const goToSearchPage = () => {
  closeDropdown()
  if (keyword.value.trim()) {
    router.push({ path: '/search', query: { q: keyword.value } })
  }
}

const goToProductDetail = (slug: string) => {
  closeDropdown()
  router.push(`/sanpham/${slug}`)
}

const closeDropdown = () => {
  // Delay nhẹ để kịp nhận sự kiện click vào item
  setTimeout(() => {
    showDropdown.value = false
  }, 100)
}

const handleLogoutClick = async () => {
  isUserDropdownOpen.value = false
  handleLogout()
  await router.push('/')
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light shadow-sm sticky-top py-2">
    <div class="container">
      <RouterLink class="navbar-brand me-4" to="/">
        <img class="img-logo" src="/images/logolaptop.png" alt="Laptop Shop Logo" />
      </RouterLink>

      <button
        class="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="mainNavbar">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0 fw-bold">
          <li class="nav-item">
            <RouterLink class="nav-link rounded-pill" active-class="active-link" to="/"
              >Trang Chủ</RouterLink
            >
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link rounded-pill" active-class="active-link" to="/sanpham"
              >Sản Phẩm</RouterLink
            >
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link rounded-pill" active-class="active-link " to="/lien-he"
              >Liên Hệ</RouterLink
            >
          </li>
        </ul>

        <div class="search-wrapper position-relative mx-auto">
          <div class="input-group">
            <input
              class="form-control border-end-0 rounded-start-pill bg-light"
              type="search"
              placeholder="Bạn tìm gì hôm nay?"
              v-model="keyword"
              @input="handleSearchInput"
              @focus="handleSearchInput"
              @keyup.enter="goToSearchPage"
            />
            <span
              v-if="keyword"
              class="position-absolute top-50 translate-middle-y text-secondary cursor-pointer"
              style="right: 60px; z-index: 100"
              @click="clearSearch"
            >
              <i class="bi bi-x-circle-fill"></i>
            </span>
            <button
              class="btn btn-light border border-start-0 rounded-end-pill px-4 hover-yellow"
              type="button"
              @click="goToSearchPage"
            >
              <i class="bi bi-search"></i>
            </button>
          </div>

          <div v-if="showDropdown && keyword.trim()" class="search-dropdown card shadow mt-1">
            <div v-if="isSearching" class="p-3 text-center text-muted">
              <div class="spinner-border spinner-border-sm text-warning" role="status"></div>
              <span class="ms-2 small">Đang tìm kiếm...</span>
            </div>

            <div v-else-if="searchResults.length === 0" class="p-3 text-center text-muted">
              <i class="bi bi-emoji-frown fs-4 d-block mb-1"></i>
              <small>Không tìm thấy sản phẩm nào.</small>
            </div>

            <ul v-else class="list-group list-group-flush">
              <li
                v-for="product in searchResults"
                :key="product.product_id"
                class="list-group-item list-group-item-action d-flex align-items-center p-2 cursor-pointer"
                @click="goToProductDetail(product.slug)"
              >
                <img
                  :src="product.primary_image || '/images/placeholder.png'"
                  class="rounded border object-fit-cover me-3"
                  width="50"
                  height="50"
                  alt="sp"
                />
                <div class="flex-grow-1">
                  <div class="text-dark fw-medium text-truncate-2">{{ product.name }}</div>
                  <div class="text-danger fw-bold small">
                    {{ formatCurrency(product.sale_price || product.price) }}
                    <span
                      v-if="product.sale_price"
                      class="text-muted text-decoration-line-through ms-1 small"
                    >
                      {{ formatCurrency(product.price) }}
                    </span>
                  </div>
                </div>
              </li>
              <li
                class="list-group-item list-group-item-action text-center py-2 bg-light cursor-pointer text-primary fw-medium"
                @click="goToSearchPage"
              >
                Xem tất cả kết quả <i class="bi bi-arrow-right"></i>
              </li>
            </ul>
          </div>
        </div>

        <div class="d-flex align-items-center ms-lg-4 mt-3 mt-lg-0 action-group">
          <RouterLink
            to="/cart"
            class="btn position-relative me-3 p-2 cart-btn"
            v-if="!isAdmin && !isStaff"
          >
            <i class="bi bi-cart3 fs-4"></i>
            <span
              v-if="cartStore.totalItems > 0"
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light"
            >
              {{ cartStore.totalItems }}
            </span>
          </RouterLink>

          <template v-if="!isAuthenticated">
            <div class="d-flex gap-2">
              <RouterLink
                to="/login"
                class="btn btn-outline-primary rounded-pill px-3 fw-bold btn-sm-custom"
                >Đăng nhập</RouterLink
              >
              <RouterLink
                to="/register"
                class="btn btn-outline-primary rounded-pill px-3 fw-bold btn-sm-custom"
                >Đăng ký</RouterLink
              >
            </div>
          </template>

          <template v-else>
            <div class="dropdown" id="user-dropdown-wrapper">
              <button
                class="btn d-flex align-items-center gap-2 border-0 p-1 rounded-pill pe-3 hover-bg-light"
                type="button"
                @click="toggleUserDropdown"
              >
                <div
                  class="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center"
                >
                  <i class="bi bi-person-fill"></i>
                </div>
                <div class="d-none d-md-block text-start lh-1">
                  <small class="text-muted" style="font-size: 10px">Xin chào,</small>
                  <div class="fw-bold" style="font-size: 14px">
                    {{ formatName(user?.full_name) }}
                  </div>
                </div>
              </button>

              <ul
                class="dropdown-menu dropdown-menu-end shadow border-0 mt-2"
                :class="{ show: isUserDropdownOpen }"
              >
                <li v-if="!isAdmin && !isStaff">
                  <RouterLink
                    class="dropdown-item py-2"
                    to="/profile"
                    @click="isUserDropdownOpen = false"
                  >
                    <i class="bi bi-person-gear me-2"></i>Hồ sơ cá nhân
                  </RouterLink>
                </li>
                <li v-if="!isAdmin && !isStaff">
                  <RouterLink
                    class="dropdown-item py-2"
                    to="/orders"
                    @click="isUserDropdownOpen = false"
                  >
                    <i class="bi bi-box-seam me-2"></i>Lịch sử mua hàng
                  </RouterLink>
                </li>

                <li v-if="isAdmin || isStaff">
                  <RouterLink
                    class="dropdown-item py-2 text-primary fw-bold"
                    to="/admin"
                    @click="isUserDropdownOpen = false"
                  >
                    <i class="bi bi-speedometer2 me-2"></i>Trang quản trị
                  </RouterLink>
                </li>

                <li><hr class="dropdown-divider" /></li>

                <li>
                  <button
                    class="dropdown-item py-2 text-danger"
                    type="button"
                    @click="handleLogoutClick"
                  >
                    <i class="bi bi-box-arrow-right me-2"></i>Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* --- 1. GENERAL --- */
.navbar {
  font-family: 'Segoe UI', sans-serif;
  transition: all 0.3s ease;
  background-color: #e9be45;
}

.img-logo {
  height: 50px;
  width: auto;
  object-fit: contain;
}

/* Link active style */
.nav-link {
  color: #555;
  transition: color 0.2s;
  position: relative;
}
.nav-link:hover {
  background-color: #f8f9fa;
}
.active-link {
  color: #0a0b0b !important;
}

.nav-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 5px;
  left: 50%;
  transition: all 0.3s;
  transform: translateX(-50%);
}
.nav-link:hover::after,
.active-link::after {
  width: 80%;
}

.search-wrapper {
  width: 100%;
  max-width: 500px;
  z-index: 1050;
}

.form-control:focus {
  box-shadow: none;
  border-color: #dee2e6;
  background-color: #fff;
}

.hover-yellow:hover {
  background-color: #81e668;
  border-color: #4cdf3f;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border-radius: 0.5rem;
  max-height: 450px;
  overflow-y: auto;
  z-index: 1051;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.9rem;
}

.cursor-pointer {
  cursor: pointer;
}

.cart-btn {
  color: #333;
  transition: transform 0.2s;
}
.cart-btn:hover {
  transform: scale(1.1);
  color: #ffffff;
}

.avatar-circle {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  font-size: 1.2rem;
}

.hover-bg-light:hover {
  background-color: #f8f9fa;
}

.btn-sm-custom {
  padding-top: 6px;
  padding-bottom: 6px;
  font-size: 0.9rem;
}

.click-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1040;
  background: rgba(0, 0, 0, 0.05);
}

@media (max-width: 992px) {
  .search-wrapper {
    margin: 15px 0;
    max-width: 100%; /* Full width trên mobile */
  }

  .action-group {
    justify-content: space-between;
    width: 100%;
    margin-top: 10px;
    border-top: 1px solid #eee;
    padding-top: 10px;
  }

  .nav-link::after {
    display: none; /* Bỏ gạch chân trên mobile */
  }
  .bi-x-circle-fill {
    font-size: 1rem;
    opacity: 0.5;
    transition: opacity 0.2s;
  }
  .bi-x-circle-fill:hover {
    opacity: 1;
    color: #dc3545; /* Màu đỏ khi hover */
  }

  /* Tinh chỉnh input để text không đè lên nút X */
  .form-control {
    padding-right: 40px; /* Chừa chỗ cho nút X */
  }
}
/* clears the 'X' from Internet Explorer */
input[type='search']::-ms-clear {
  display: none;
  width: 0;
  height: 0;
}
input[type='search']::-ms-reveal {
  display: none;
  width: 0;
  height: 0;
}

/* clears the 'X' from Chrome */
input[type='search']::-webkit-search-decoration,
input[type='search']::-webkit-search-cancel-button,
input[type='search']::-webkit-search-results-button,
input[type='search']::-webkit-search-results-decoration {
  display: none;
}
</style>
