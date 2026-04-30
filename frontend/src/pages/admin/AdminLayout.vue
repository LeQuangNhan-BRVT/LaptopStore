<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="admin-layout d-flex flex-column flex-lg-row">
    <div
      class="mobile-header d-lg-none p-3 bg-dark text-white d-flex justify-content-between align-items-center"
    >
      <h5 class="m-0">Trang quản lý</h5>
      <button
        class="btn btn-outline-light"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#adminSidebar"
        aria-controls="adminSidebar"
      >
        <i class="bi bi-list fs-4"></i>
      </button>
    </div>

    <nav
      class="sidebar offcanvas-lg offcanvas-start bg-dark text-white flex-shrink-0"
      tabindex="-1"
      id="adminSidebar"
      aria-labelledby="adminSidebarLabel"
    >
      <div class="offcanvas-header border-bottom border-secondary">
        <h5 class="offcanvas-title" id="adminSidebarLabel">Menu Quản Lý</h5>
        <button
          type="button"
          class="btn-close btn-close-white"
          data-bs-dismiss="offcanvas"
          data-bs-target="#adminSidebar"
          aria-label="Close"
        ></button>
      </div>

      <div class="offcanvas-body p-3 d-flex flex-column h-100">
        <h4 class="text-center mb-4 d-none d-lg-block">Trang quản lý</h4>

        <ul class="nav nav-pills flex-column mb-auto">
          <li class="nav-item mb-2" v-if="authStore.isAdmin">
            <RouterLink to="/admin/statistics" class="nav-link text-white" active-class="active">
              <i class="bi bi-bar-chart-line-fill me-2"></i> Thống kê
            </RouterLink>
          </li>
          <li class="nav-item mb-2" v-if="authStore.isAdmin">
            <RouterLink to="/admin/products" class="nav-link text-white" active-class="active">
              <i class="bi bi-box-seam-fill me-2"></i> Sản phẩm
            </RouterLink>
          </li>
          <li class="nav-item mb-2" v-if="authStore.isAdmin">
            <RouterLink to="/admin/brands" class="nav-link text-white" active-class="active">
              <i class="bi bi-tag-fill me-2"></i> Thương hiệu
            </RouterLink>
          </li>
          <li class="nav-item mb-2" v-if="authStore.isAdmin">
            <RouterLink to="/admin/categories" class="nav-link text-white" active-class="active">
              <i class="bi bi-bookmark-fill me-2"></i> Danh mục
            </RouterLink>
          </li>
          <li class="nav-item mb-2">
            <RouterLink to="/admin/orders" class="nav-link text-white" active-class="active">
              <i class="bi bi-receipt me-2"></i> Đơn hàng
            </RouterLink>
          </li>
          <li class="nav-item mb-2" v-if="authStore.isAdmin">
            <RouterLink to="/admin/users" class="nav-link text-white" active-class="active">
              <i class="bi bi-people-fill me-2"></i> Người dùng
            </RouterLink>
          </li>
          <li class="nav-item mb-2" v-if="authStore.isAdmin">
            <RouterLink to="/admin/staffs" class="nav-link text-white" active-class="active">
              <i class="bi bi-person-badge-fill me-2"></i> Nhân viên
            </RouterLink>
          </li>
        </ul>

        <hr class="text-white-50" />

        <div class="mt-auto">
          <RouterLink to="/" class="nav-link text-white-50">
            <i class="bi bi-arrow-left-square me-2"></i> Quay về trang chủ
          </RouterLink>
        </div>
      </div>
    </nav>

    <main class="content-area p-4 w-100">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.sidebar {
  width: 280px;
  /* Quan trọng: Ngăn sidebar bị co lại khi nội dung bên phải quá rộng */
  flex-shrink: 0;
  min-height: 100vh;
  transition: all 0.3s;
}

.content-area {
  flex-grow: 1;
  background-color: #f8f9fa;
  /* Đảm bảo content không bị tràn gây vỡ layout */
  min-width: 0;
}

.nav-pills .nav-link.active {
  background-color: #0d6efd;
  font-weight: bold;
}

.nav-link:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Xử lý hiển thị trên Mobile */
@media (max-width: 991.98px) {
  .sidebar {
    min-height: auto; /* Trên mobile sidebar là offcanvas nên không cần min-height */
    width: 280px; /* Chiều rộng drawer khi mở ra */
  }

  .content-area {
    min-height: calc(100vh - 60px); /* Trừ đi chiều cao header mobile */
  }
}
</style>
