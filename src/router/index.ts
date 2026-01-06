import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/pages/AboutPage.vue'),
    },
    { path: '/lien-he', name: 'contact', component: () => import('@/pages/ContactPage.vue') },
    {
      path: '/sanpham',
      name: 'products',
      component: () => import('@/pages/ProductListPage.vue'),
    },
    {
      path: '/sanpham/:slug',
      name: 'product-detail',
      component: () => import('@/pages/ProductDetailPage.vue'),
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/pages/admin/AdminLoginPage.vue'),
    },
    {
      path: '/login',
      name: 'user-login',
      component: () => import('@/pages/LoginPage.vue'),
    },
    {
      path: '/register', // Đường dẫn mà bạn vừa nhấp vào
      name: 'user-register',
      // Component sẽ được hiển thị
      component: () => import('@/pages/RegisterPage.vue'),
    },
    {
      path: '/social/callback',
      name: 'social-callback',
      component: () => import('@/pages/SocialCallback.vue'),
    },

    {
      path: '/cart',
      name: 'cart-items',
      component: () => import('@/pages/CartPage.vue'),
    },
    {
      path: '/compare',
      name: 'product-compare',
      component: () => import('@/pages/ProductComparePage.vue'),
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/pages/CheckoutPage.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/UserProfilePage.vue'),
    },
    {
      path: '/orders/success',
      name: 'orders-success',
      component: () => import('@/pages/OrderSuccessPage.vue'),
    },
    {
      path: '/orders',
      name: 'order-history',
      component: () => import('@/pages/OrderHistoryPage.vue'),
    },
    {
      path: '/payment-result',
      component: () => import('@/pages/PaymentResultPage.vue'),
    },
    {
      path: '/payment-sepay',
      name: 'payment-sepay',
      component: () => import('@/pages/PaymentSepayPage.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/pages/SearchPage.vue'),
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/pages/auth/ResetPasswordPage.vue'),
    },

    {
      path: '/admin',
      component: () => import('@/pages/admin/AdminLayout.vue'),

      // Đây là các route "con", sẽ được render vào <RouterView> của AdminLayout
      children: [
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('@/pages/admin/AdminProductList.vue'),
        },
        {
          path: 'products/new', // Đường dẫn /admin/products/new
          name: 'admin-product-create',
          component: () => import('@/pages/admin/AdminProductCreate.vue'),
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('@/pages/admin/AdminOrderPage.vue'),
          meta: { requiresAdmin: true, title: 'Quản lý đơn hàng', isAdmin: true },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/pages/admin/AdminUserList.vue'),
        },
        {
          path: 'products/edit/:id',
          name: 'admin-product-edit',
          component: () => import('@/pages/admin/AdminProductEdit.vue'),
        },
        {
          path: 'brands',
          name: 'admin-brands',
          component: () => import('@/pages/admin/AdminBrandList.vue'),
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('@/pages/admin/AdminCategoryList.vue'),
        },
        {
          path: 'staffs',
          name: 'admin-staffs',
          component: () => import('@/pages/admin/AdminStaffPage.vue'),
        },
        {
          path: 'statistics',
          name: 'admin-statistics',
          component: () => import('@/pages/admin/AdminStatisticsPage.vue'),
          meta: { requiresAdmin: true, title: 'Thống kê doanh thu', isAdmin: true },
        },

        {
          path: '',
          redirect: (to) => {
            return { name: 'admin-products' }
          },
        },
      ],
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAdmin = to.path.startsWith('/admin') && to.name !== 'admin-login'

  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUserProfile()
    } catch (error) {
      console.error('Không thể làm mới phiên đăng nhập:', error)
    }
  }

  if (requiresAdmin) {
    if (!authStore.token) {
      return next({ name: 'admin-login', query: { redirect: to.fullPath } })
    }

    if (!authStore.user) {
      try {
        await authStore.fetchUserProfile()
      } catch (error) {
        console.error('Không thể tải thông tin quản trị viên:', error)
      }
    }

    if (!authStore.user || (!authStore.isAdmin && !authStore.isStaff)) {
      return next({ name: 'admin-login', query: { redirect: to.fullPath } })
    }
  }
  if (to.meta.isAdmin && !authStore.isAdmin && !authStore.isStaff) {
    alert('Bạn không có quyền truy cập trang này')
    return next('/')
  }

  next()
})

export default router
