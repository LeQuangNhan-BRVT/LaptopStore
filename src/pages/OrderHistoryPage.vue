<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { orderService } from '@/services/orderService'
import { useRouter } from 'vue-router'
import type { IOrder } from '@/types/Order'
import type { IUser } from '@/types/Order'
import Swal from 'sweetalert2'
import { useCartStore } from '@/store/cart'
import { ghnService } from '@/services/ghnService'

const cartStore = useCartStore()
const router = useRouter()
import { storeToRefs } from 'pinia'
const orders = ref<IOrder[]>([])
const isLoading = ref(true)
let stopProvinceWatcher: (() => void) | null = null
let stopDistrictWatcher: (() => void) | null = null
let stopWardWatcher: (() => void) | null = null
const currentPage = ref(1)
const totalPages = ref(1)
const sortBy = ref('created_at')
const sortOrder = ref<'ASC' | 'DESC'>('DESC')
const filterStatus = ref('')
const { items, subTotal } = storeToRefs(cartStore)
const expandedOrderId = ref<number | null>(null)
const customerName = ref('')
const customerPhone = ref('')
const addressDetail = ref('')
const note = ref('') || null

// Dữ liệu Địa chỉ (Dropdowns)
const provinces = ref<any[]>([])
const districts = ref<any[]>([])
const wards = ref<any[]>([])

// Lựa chọn của người dùng
const selectedProvince = ref<number | null>(null)
const selectedDistrict = ref<number | null>(null)
const selectedWard = ref<string | null>(null)

// Phí ship & Loading
const shippingFee = ref(0)
const isCalculatingShip = ref(false)
const isLoadingLocation = ref(false) // Loading khi tải tỉnh/huyện

const totalAmount = computed(() => subTotal.value + shippingFee.value)

//thanh toan
const paymentMethod = ref('cod')
const isSubmitting = ref(false)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    Number(value),
  )
}
const statusOptions = [
  { value: 'pending', label: 'Chờ duyệt đơn', class: 'text-warning' },
  { value: 'payment', label: 'Chờ thanh toán', class: 'text-warning' },
  { value: 'processing', label: 'Đang xử lý', class: 'text-info' },
  { value: 'shipped', label: 'Đang giao', class: 'text-primary' },
  { value: 'delivered', label: 'Đã giao', class: 'text-success' },
  { value: 'cancelled', label: 'Đã hủy', class: 'text-danger' },
  { value: 'paid', label: 'Đã thanh toán (Online)', class: 'text-success' },
]

const fetchOrders = async () => {
  isLoading.value = true
  try {
    const res = await orderService.getMyOrders(
      currentPage.value,
      filterStatus.value,
      sortBy.value,
      sortOrder.value,
    )
    orders.value = res.data
    totalPages.value = res.meta.last_page
  } catch (error) {
    console.error('Lỗi tải đơn hàng:', error)
  } finally {
    isLoading.value = false
  }
}

const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'DESC' ? 'ASC' : 'DESC'
  } else {
    sortBy.value = column
    sortOrder.value = 'DESC'
  }
  fetchOrders()
}

const getSortIcon = (column: string) => {
  if (sortBy.value !== column) return 'bi-arrow-down-up text-muted opacity-25'
  return sortOrder.value === 'ASC' ? 'bi-sort-up text-primary' : 'bi-sort-down text-primary'
}

const toggleDetails = (orderId: number) => {
  if (expandedOrderId.value === orderId) {
    expandedOrderId.value = null
  } else {
    expandedOrderId.value = orderId
  }
}

// Format ngày tháng
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const cancelOrder = async (orderId: number) => {
  const result = await Swal.fire({
    title: 'Hủy đơn hàng?',
    text: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Đồng ý hủy',
    cancelButtonText: 'Không',
  })
  if (!result.isConfirmed) return
  try {
    isLoading.value = true
    await orderService.cancelOrder(orderId)
    await fetchOrders()
    Swal.fire('Đã hủy!', 'Đơn hàng đã được hủy thành công.', 'success')
  } catch (error) {
    Swal.fire('Lỗi!', 'Không thể hủy đơn hàng này.', 'error')
    console.log(error)
  } finally {
    isLoading.value = false
  }
}

const payNow = async (order: IOrder) => {
  if (order.payment_method_id === 2) {
    try {
      Swal.fire({
        title: 'Đang kết nối VNPay...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      const vnpayRes = await orderService.createPaymentUrl({
        amount: Number(order.final_amount),
        orderId: order.order_code,
      })

      const paymentUrl = vnpayRes.data || vnpayRes.url || vnpayRes

      if (typeof paymentUrl === 'string' && paymentUrl.startsWith('http')) {
        window.location.href = paymentUrl
      } else {
        Swal.fire('Lỗi', 'Link thanh toán VNPay không hợp lệ', 'error')
      }
    } catch (error: any) {
      console.error(error)
      Swal.fire('Lỗi', 'Không thể tạo thanh toán VNPay', 'error')
    }
  } else if (order.payment_method_id === 3) {
    router.push({
      name: 'payment-sepay',
      query: {
        orderCode: order.order_code,
        amount: order.final_amount,
      },
    })
  } else if (order.payment_method_id === 1) {
    
    router.push({
      name: 'orders-success',
    })
  } else {
    Swal.fire('Thông báo', 'Phương thức thanh toán này không hỗ trợ thanh toán trực tuyến.', 'info')
  }
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-warning text-dark'
    case 'processing':
      return 'bg-info text-dark'
    case 'payment':
      return 'bg-warning text-dark'
    case 'paid':
      return 'bg-success'
    case 'shipped': //đang giao
      return 'bg-primary'
    case 'cancelled':
      return 'bg-danger'
    case 'delivered':
      return 'bg-secondary'
    default:
      return 'bg-secondary'
  }
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Chờ duyệt đơn',
    payment: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    processing: 'Đang xử lý',
    shipped: 'Đang giao hàng',
    delivered: 'Giao thành công',
    cancelled: 'Đã hủy',
  }
  return map[status.toLowerCase()] || status
}

watch([filterStatus], () => {
  currentPage.value = 1
  fetchOrders()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

watch([currentPage], () => {
  fetchOrders()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

onMounted(async () => {
  fetchOrders()
})
</script>

<template>
  <div class="container py-5">
    <div
      class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-3"
    >
      <h2 class="mb-0">Lịch sử đơn hàng</h2>
      <div
        class="d-flex align-items-center w-100 w-md-auto justify-content-between justify-content-md-end"
      >
        <span class="me-2 text-nowrap">Lọc trạng thái:</span>
        <select v-model="filterStatus" class="form-select w-auto">
          <option value="">Tất cả</option>
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <div v-else-if="orders.length === 0" class="text-center py-5 bg-light rounded">
      <i class="bi bi-inbox fs-1 text-muted"></i>
      <p class="mt-3">Bạn chưa có đơn hàng nào.</p>
      <RouterLink to="/" class="btn btn-primary">Mua sắm ngay</RouterLink>
    </div>

    <div v-else>
      <div class="card shadow-sm d-none d-md-block">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light user-select-none">
                <tr>
                  <th class="ps-4">Mã đơn hàng</th>
                  <th @click="handleSort('created_at')" style="cursor: pointer">
                    Ngày đặt <i class="bi ms-1" :class="getSortIcon('created_at')"></i>
                  </th>
                  <th>Sản phẩm</th>
                  <th @click="handleSort('final_amount')" style="cursor: pointer">
                    Tổng tiền <i class="bi ms-1" :class="getSortIcon('final_amount')"></i>
                  </th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                  <th @click="handleSort('payment_method')" style="cursor: pointer">
                    Thanh toán <i class="bi ms-1" :class="getSortIcon('payment_method')"></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="order in orders" :key="order.order_id">
                  <tr
                    @click="toggleDetails(order.order_id)"
                    role="button"
                    :class="{ 'table-active': expandedOrderId === order.order_id }"
                    title="Nhấn để xem chi tiết"
                  >
                    <td class="ps-4 fw-bold text-primary">
                      <i
                        class="bi"
                        :class="
                          expandedOrderId === order.order_id
                            ? 'bi-caret-down-fill'
                            : 'bi-caret-right-fill'
                        "
                      ></i>
                      #{{ order.order_code }}
                    </td>
                    <td>{{ formatDate(order.created_at) }}</td>
                    <td>
                      <div v-if="order.order_items && order.order_items.length > 0">
                        {{ order.order_items[0]?.product?.name }}
                        <strong>
                          <span v-if="order.order_items.length > 1" class="text-primary">
                            (+{{ order.order_items.length - 1 }} khác)
                          </span></strong
                        >
                      </div>
                    </td>
                    <td class="fw-bold">{{ formatCurrency(order.final_amount) }}</td>
                    <td>
                      <span class="badge rounded-pill" :class="getStatusBadge(order.status)">
                        {{ getStatusText(order.status) }}
                      </span>
                    </td>
                    <td @click.stop>
                      <button
                        v-if="order.status === 'pending'"
                        class="btn btn-outline-danger btn-sm"
                        @click="cancelOrder(order.order_id)"
                      >
                        Hủy đơn
                      </button>
                      <button
                        v-if="order.status === 'payment'"
                        class="btn btn-outline-danger btn-sm"
                        @click="payNow(order)"
                      >
                        Thanh toán
                      </button>
                    </td>
                    <td class="small text-muted">{{ order.payment_method?.name }}</td>
                  </tr>
                  <tr v-if="expandedOrderId === order.order_id" class="bg-light">
                    <td colspan="6" class="p-4">
                      <div class="row">
                        <div class="col-md-6 border-end">
                          <h6 class="text-primary fw-bold mb-3">
                            <i class="bi bi-geo-alt-fill"></i> Thông tin giao hàng
                          </h6>
                          <p class="mb-1">
                            <strong>Người đặt:</strong> {{ order.user?.full_name }}
                          </p>
                          <p class="mb-1">
                            <strong>SĐT:</strong> {{ order.user?.phone_number || 'Chưa cập nhật' }}
                          </p>
                          <p class="mb-1">
                            <strong>Nơi nhận hàng:</strong> {{ order.shipping_address }}
                          </p>
                          <p class="mb-0 mt-3 fst-italic text-muted bg-white p-2 rounded border">
                            <strong><i class="bi bi-sticky"></i> Ghi chú:</strong>
                            {{ order.notes || 'Không có ghi chú' }}
                          </p>
                        </div>

                        <div class="col-md-6 ps-md-4">
                          <h6 class="text-primary fw-bold mb-3">
                            <i class="bi bi-box-seam-fill"></i> Sản phẩm đã đặt
                          </h6>
                          <ul class="list-group list-group-flush bg-transparent">
                            <li
                              v-for="item in order.order_items"
                              :key="item.order_item_id"
                              class="list-group-item bg-transparent d-flex justify-content-between align-items-center px-0"
                            >
                              <div>
                                <span class="fw-bold">{{ item.product?.name }}</span>
                                <br />
                                <small class="text-muted">SL: x{{ item.quantity }}</small>
                              </div>
                              <span class="fw-bold"
                                >{{
                                  new Intl.NumberFormat('vi-VN').format(
                                    item.price_at_purchase * item.quantity,
                                  )
                                }}đ</span
                              >
                            </li>
                          </ul>
                          <div
                            class="d-flex justify-content-between mt-3 pt-2 border-top fw-bold fs-5"
                          >
                            <span>Tổng cộng:</span>
                            <span class="text-danger"
                              >{{
                                new Intl.NumberFormat('vi-VN').format(order.final_amount)
                              }}đ</span
                            >
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="d-md-none">
        <div v-for="order in orders" :key="'mobile-' + order.order_id" class="card shadow-sm mb-3">
          <div
            class="card-header d-flex justify-content-between align-items-center bg-white"
            @click="toggleDetails(order.order_id)"
          >
            <span class="fw-bold text-primary">#{{ order.order_code }}</span>
            <span class="badge rounded-pill" :class="getStatusBadge(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>

          <div class="card-body" @click="toggleDetails(order.order_id)">
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted small">Ngày đặt:</span>
              <span>{{ formatDate(order.created_at) }}</span>
            </div>

            <div class="mb-2">
              <span class="text-muted small d-block">Sản phẩm:</span>
              <div v-if="order.order_items && order.order_items.length > 0" class="fw-medium">
                {{ order.order_items[0]?.product?.name }}
                <span v-if="order.order_items.length > 1" class="text-muted small fst-italic">
                  (+{{ order.order_items.length - 1 }} sản phẩm khác)
                </span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <span class="fw-bold fs-5 text-danger">{{ formatCurrency(order.final_amount) }}</span>
              <button
                v-if="order.status === 'pending'"
                class="btn btn-outline-danger btn-sm"
                @click.stop="cancelOrder(order.order_id)"
              >
                Hủy đơn
              </button>
            </div>
          </div>

          <div v-if="expandedOrderId === order.order_id" class="card-footer bg-light text-small">
            <div class="mb-2">
              <i class="bi bi-credit-card me-1"></i> {{ order.payment_method?.name }}
            </div>
            <div class="mb-2"><i class="bi bi-geo-alt me-1"></i> {{ order.shipping_address }}</div>
            <div v-if="order.notes"><i class="bi bi-sticky me-1"></i> {{ order.notes }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 d-flex justify-content-center" v-if="totalPages > 1">
      <button
        class="btn btn-sm btn-outline-primary me-2"
        @click="currentPage--"
        :disabled="currentPage === 1"
      >
        Trước
      </button>
      <span class="align-self-center">Trang {{ currentPage }} / {{ totalPages }}</span>
      <button
        class="btn btn-sm btn-outline-primary ms-2"
        @click="currentPage++"
        :disabled="currentPage === totalPages"
      >
        Sau
      </button>
    </div>
  </div>
</template>
