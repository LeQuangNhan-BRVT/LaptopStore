<script setup lang="ts">
  import { ref, onMounted, watch, onUnmounted, reactive } from 'vue'
  import Swal from 'sweetalert2'
  import { orderService } from '@/services/orderService'
  import type { IOrder } from '@/types/Order'
  
  // --- STATE ---
  const orders = ref<IOrder[]>([])
  const isLoading = ref(false)
  let pollingInterval: ReturnType<typeof setInterval> | null = null
  const isAutoRefresh = ref(true)
  
  // Phân trang
  const currentPage = ref(1)
  const totalPages = ref(1)
  const limit = ref(10)
  
  // Sắp xếp
  const sortBy = ref('created_at')
  const sortOrder = ref<'ASC' | 'DESC'>('DESC')
  
  // --- BỘ LỌC (NEW) ---
  const filters = reactive({
    search: '',            // Tìm theo mã đơn hoặc tên khách
    status: '',            // Trạng thái
    payment_method_id: '', // Phương thức thanh toán
    start_date: '',        // Từ ngày
    end_date: '',          // Đến ngày
  })
  
  const expandedOrderId = ref<number | null>(null)
  
  // Dữ liệu tĩnh cho Select box
  const statusOptions = [
    { value: 'pending', label: 'Chờ duyệt đơn' },
    { value: 'payment', label: 'Chờ thanh toán' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipped', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'paid', label: 'Đã thanh toán (Online)' },
  ]
  
  const paymentOptions = [
    { id: 1, name: 'Thanh toán khi nhận hàng (COD)' },
    { id: 2, name: 'VNPay' },
    { id: 3, name: 'SePay' },
  ]
  
  // --- API FETCH ---
  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) isLoading.value = true
    try {
      // Chuẩn bị params gửi lên Backend
      const params: any = {
        page: currentPage.value,
        limit: limit.value,
        sort_by: sortBy.value,
        sort_desc: sortOrder.value === 'DESC', // Backend có thể cần true/false hoặc 'DESC'
        // Các bộ lọc
        status: filters.status,
        search: filters.search,
        payment_method_id: filters.payment_method_id,
        start_date: filters.start_date,
        end_date: filters.end_date
      }
  
      // Xóa các key rỗng để URL sạch hơn
      Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null) delete params[key];
      });
  
      const res = await orderService.getAllOrders(params)
      orders.value = res.data
      totalPages.value = res.meta.last_page
    } catch (error) {
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }
  
  const handleSearch = () => {
    currentPage.value = 1
    fetchOrders()
  }
  
  const resetFilters = () => {
    filters.search = ''
    filters.status = ''
    filters.payment_method_id = ''
    filters.start_date = ''
    filters.end_date = ''
    currentPage.value = 1
    fetchOrders()
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
    expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
  }
  
  const handleStatusChange = async (order: IOrder, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(order.order_id, newStatus)
      order.status = newStatus
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', 
        title: 'Cập nhật thành công!', showConfirmButton: false, timer: 1500
      })
    } catch (error) {
      console.error(error)
      Swal.fire('Lỗi', 'Không thể cập nhật trạng thái', 'error')
    }
  }
  
  const getValidStatusOptions = (order: any) => {
    if (order.payment_method_id === 1) {
      return statusOptions.filter((opt) => opt.value !== 'payment')
    }
    return statusOptions
  }
  
  // --- LIFECYCLE ---
  watch(currentPage, () => {
    fetchOrders()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
  
  onMounted(() => {
    fetchOrders()
    pollingInterval = setInterval(() => {
      if (isAutoRefresh.value) fetchOrders(true)
    }, 15000)
  })
  
  onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval)
  })
  </script>
  
  <template>
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="mb-0 fw-bold">Quản lý Đơn hàng</h3>
        <div class="form-check form-switch">
           <input class="form-check-input" type="checkbox" v-model="isAutoRefresh">
           <label class="form-check-label small text-muted">Tự động làm mới</label>
        </div>
      </div>
  
      <div class="card shadow-sm mb-4 bg-light border-0">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
               <label class="form-label small fw-bold text-muted">Từ khóa</label>
               <input type="text" class="form-control" 
                      placeholder="Mã đơn,Tên KH, SDT" 
                      v-model="filters.search"
                      @keyup.enter="handleSearch">
            </div>
  
            <div class="col-md-2">
               <label class="form-label small fw-bold text-muted">Trạng thái</label>
               <select class="form-select" v-model="filters.status" @change="handleSearch">
                  <option value="">Tất cả</option>
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                     {{ opt.label }}
                  </option>
               </select>
            </div>
  
            <div class="col-md-2">
               <label class="form-label small fw-bold text-muted">Thanh toán</label>
               <select class="form-select" v-model="filters.payment_method_id" @change="handleSearch">
                  <option value="">Tất cả</option>
                  <option v-for="pm in paymentOptions" :key="pm.id" :value="pm.id">
                     {{ pm.name }}
                  </option>
               </select>
            </div>
  
            <div class="col-md-3">
               <label class="form-label small fw-bold text-muted">Ngày đặt hàng</label>
               <div class="input-group">
                  <input type="date" class="form-control" v-model="filters.start_date">
                  <span class="input-group-text bg-white">-</span>
                  <input type="date" class="form-control" v-model="filters.end_date">
               </div>
            </div>
  
            <div class="col-md-2 d-flex align-items-end gap-2">
               <button class="btn btn-primary w-100" @click="handleSearch">
                  <i class="bi bi-search"></i> Tìm
               </button>
               <button class="btn btn-secondary" @click="resetFilters" title="Đặt lại">
                  <i class="bi bi-arrow-counterclockwise"></i>
               </button>
            </div>
          </div>
        </div>
      </div>
  
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
  
      <div v-else>
        <div class="card shadow-sm d-none d-md-block">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light user-select-none">
                  <tr>
                    <th class="ps-4">Mã đơn</th>
                    <th @click="handleSort('created_at')" style="cursor: pointer">
                      Ngày đặt <i class="bi ms-1" :class="getSortIcon('created_at')"></i>
                    </th>
                    <th>Khách hàng</th>
                    <th @click="handleSort('final_amount')" style="cursor: pointer">
                      Tổng tiền <i class="bi ms-1" :class="getSortIcon('final_amount')"></i>
                    </th>
                    <th @click="handleSort('payment_method')" style="cursor: pointer">
                      Phương thức <i class="bi ms-1" :class="getSortIcon('payment_method')"></i>
                    </th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="order in orders" :key="order.order_id">
                    <tr
                      @click="toggleDetails(order.order_id)"
                      role="button"
                      :class="{ 'table-active': expandedOrderId === order.order_id }"
                    >
                      <td class="ps-4 fw-bold text-primary">
                        <i class="bi" :class="expandedOrderId === order.order_id ? 'bi-caret-down-fill' : 'bi-caret-right-fill'"></i>
                        #{{ order.order_code }}
                      </td>
                      <td>{{ new Date(order.created_at).toLocaleDateString('vi-VN') }} <br> <small class="text-muted">{{ new Date(order.created_at).toLocaleTimeString('vi-VN') }}</small></td>
                      <td>
                        <div class="fw-medium">{{ order.user?.full_name }}</div>
                        <small class="text-muted">{{ order.user?.email }}</small>
                      </td>
                      <td class="fw-bold text-danger">
                        {{ new Intl.NumberFormat('vi-VN').format(order.final_amount) }}đ
                      </td>
                      <td>
                        <span class="badge" 
                          :class="{'bg-success': order.payment_method_id !== 1, 'bg-secondary': order.payment_method_id === 1}">
                          {{ order.payment_method?.name }}
                        </span>
                      </td>
                      
                      <td @click.stop>
                        <select
                          class="form-select form-select-sm fw-bold border-0 bg-transparent"
                          :class="{
                            'text-warning': order.status === 'pending',
                            'text-dark': order.status === 'payment',
                            'text-success': order.status === 'delivered' || order.status === 'paid',
                            'text-danger': order.status === 'cancelled',
                            'text-primary': order.status === 'shipped',
                            'text-info': order.status === 'processing',
                          }"
                          :value="order.status"
                          @change="handleStatusChange(order, ($event.target as HTMLSelectElement).value)"
                          :disabled="order.status === 'cancelled' || order.status === 'delivered'"
                        >
                          <option
                            v-for="opt in getValidStatusOptions(order)"
                            :key="opt.value"
                            :value="opt.value"
                            class="text-dark"
                          >
                            {{ opt.label }}
                          </option>
                        </select>
                      </td>
                    </tr>
  
                    <tr v-if="expandedOrderId === order.order_id" class="bg-light">
                      <td colspan="6" class="p-4">
                        <div class="row">
                          <div class="col-md-6 border-end">
                            <h6 class="text-primary fw-bold mb-3"><i class="bi bi-geo-alt-fill"></i> Thông tin giao hàng</h6>
                            <p class="mb-1"><strong>Người đặt:</strong> {{ order.user?.full_name }}</p>
                            <p class="mb-1"><strong>SĐT:</strong> {{ order.user?.phone_number || 'Chưa cập nhật' }}</p>
                            <p class="mb-1"><strong>Nơi nhận:</strong> {{ order.shipping_address }}</p>
                            <p class="mb-0 mt-3 fst-italic text-muted bg-white p-2 rounded border">
                              <strong><i class="bi bi-sticky"></i> Ghi chú:</strong> {{ order.notes || 'Không có ghi chú' }}
                            </p>
                          </div>
                          <div class="col-md-6 ps-md-4">
                            <h6 class="text-primary fw-bold mb-3"><i class="bi bi-box-seam-fill"></i> Sản phẩm đã đặt</h6>
                            <ul class="list-group list-group-flush bg-transparent">
                              <li v-for="item in order.order_items" :key="item.order_item_id" class="list-group-item bg-transparent d-flex justify-content-between px-0">
                                 <div>
                                    <span class="fw-bold">{{ item.product?.name }}</span> <br>
                                    <small class="text-muted">SL: x{{ item.quantity }}</small>
                                 </div>
                                 <span class="fw-bold">{{ new Intl.NumberFormat('vi-VN').format(item.price_at_purchase * item.quantity) }}đ</span>
                              </li>
                            </ul>
                            <div class="d-flex justify-content-between mt-3 pt-2 border-top fw-bold fs-5">
                              <span>Tổng cộng:</span>
                              <span class="text-danger">{{ new Intl.NumberFormat('vi-VN').format(order.final_amount) }}đ</span>
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
           <div v-for="order in orders" :key="'mobile-' + order.order_id" class="card shadow-sm mb-3 border-0">
              </div>
        </div>
  
        <div class="mt-4 d-flex justify-content-center" v-if="totalPages > 1">
          <button class="btn btn-sm btn-outline-primary me-2" @click="currentPage--" :disabled="currentPage === 1">Trước</button>
          <span class="align-self-center">Trang {{ currentPage }} / {{ totalPages }}</span>
          <button class="btn btn-sm btn-outline-primary ms-2" @click="currentPage++" :disabled="currentPage === totalPages">Sau</button>
        </div>
        
        <div v-if="!isLoading && orders.length === 0" class="text-center py-5 text-muted">
           <i class="bi bi-inbox fs-1 d-block mb-2"></i>
           Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
        </div>
      </div>
    </div>
  </template>
  
  <style scoped>
  th[style*='cursor: pointer']:hover {
    background-color: #e9ecef;
  }
  /* Style cho ô input date để nó gọn hơn */
  input[type="date"] {
      font-size: 0.875rem;
  }
  </style>