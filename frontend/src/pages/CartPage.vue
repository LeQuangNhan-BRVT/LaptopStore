<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const { items, subTotal } = storeToRefs(cartStore)
const router = useRouter()
const authStore = useAuthStore()
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const handleCheckout = () => {
  if (items.value.length === 0) return
  if (!authStore.isAuthenticated) {
    alert('Vui lòng đăng nhập để tiến hành thanh toán.')
    router.push('/login')
    return
  }
  router.push('/checkout')
}

const getProductImage = (product: any) => {
  let url = ''

  
  if (product.primary_image) {
    url = product.primary_image
  } else if (product.images && product.images.length > 0) {
    const primary = product.images.find((img: any) => img.is_primary)
    url = primary ? primary.image_url : product.images[0].image_url
  }

  
  if (url) {
    
    return encodeURI(url)
  }


  return ''
}
</script>

<template>
  <div class="container py-5">
    <h2 class="mb-4">Giỏ Hàng Của Bạn</h2>

    <div v-if="items.length === 0" class="text-center py-5 bg-light rounded">
      <i class="bi bi-cart-x fs-1 text-muted"></i>
      <p class="mt-3">Giỏ hàng của bạn đang trống.</p>
      <RouterLink to="/" class="btn btn-primary">Tiếp tục mua sắm</RouterLink>
    </div>

    <div v-else class="row">
      <div class="col-lg-8">
        <div class="card shadow-sm mb-4">
          <div class="card-body p-0">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.product.product_id">
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <img
                        :src="getProductImage(item.product)"
                        class="rounded border me-3"
                        style="width: 60px; height: 60px; object-fit: cover"
                      />
                      <div>
                        <div class="fw-bold text-truncate" style="max-width: 200px">
                          {{ item.product.name }}
                        </div>
                        <small class="text-muted">SKU: {{ item.product.sku }}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div v-if="item.product.sale_price">
                      <span class="text-danger fw-bold">{{
                        formatCurrency(item.product.sale_price)
                      }}</span>
                      <br />
                      <small class="text-muted text-decoration-line-through">{{
                        formatCurrency(item.product.price)
                      }}</small>
                    </div>
                    <div v-else class="fw-bold">
                      {{ formatCurrency(item.product.price) }}
                    </div>
                  </td>

                  <td>
                    <div class="input-group input-group-sm" style="width: 100px">
                      <button
                        class="btn btn-outline-secondary"
                        @click="
                          cartStore.updateQuantity(item.product.product_id, item.quantity - 1)
                        "
                      >
                        -
                      </button>
                      <input
                        type="text"
                        class="form-control text-center"
                        :value="item.quantity"
                        readonly
                      />
                      <button
                        class="btn btn-outline-secondary"
                        @click="
                          cartStore.updateQuantity(item.product.product_id, item.quantity + 1)
                        "
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td class="fw-bold">
                    {{
                      formatCurrency(
                        (item.product.sale_price || item.product.price) * item.quantity,
                      )
                    }}
                  </td>

                  <td>
                    <button
                      class="btn btn-link text-danger"
                      @click="cartStore.removeFromCart(item.product.product_id)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-4">Cộng Giỏ Hàng</h5>
            <div class="d-flex justify-content-between mb-3">
              <span>Tạm tính:</span>
              <span class="fw-bold">{{ formatCurrency(subTotal) }}</span>
            </div>
            <hr />
            <div class="d-flex justify-content-between mb-4">
              <span class="fs-5 fw-bold">Tổng cộng:</span>
              <span class="fs-5 fw-bold text-danger">{{ formatCurrency(subTotal) }}</span>
            </div>
            <small class="text-muted d-block mb-3"
              >* Phí vận chuyển sẽ được tính ở trang thanh toán.</small
            >

            <button class="btn btn-danger w-100 btn-lg" @click="handleCheckout">
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
