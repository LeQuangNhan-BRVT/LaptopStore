<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useCartStore } from '@/store/cart'
import { storeToRefs } from 'pinia'
import { ghnService } from '@/services/ghnService'
import { useRouter } from 'vue-router'
import { orderService } from '@/services/orderService'
import Swal from 'sweetalert2'
const cartStore = useCartStore()
const { items, subTotal } = storeToRefs(cartStore)
const router = useRouter()

// Dữ liệu Form
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
let stopProvinceWatcher: (() => void) | null = null
let stopDistrictWatcher: (() => void) | null = null
let stopWardWatcher: (() => void) | null = null

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

// 1. Load Tỉnh khi vào trang
onMounted(async () => {
  // Nếu giỏ hàng trống, đuổi về trang giỏ hàng
  if (items.value.length === 0) {
    router.push('/cart')
    return
  }

  isLoadingLocation.value = true
  try {
    console.log('Đang tải danh sách tỉnh...')
    // Gọi Service (Service này sẽ gọi Backend NestJS)
    const data = await ghnService.getProvinces()
    provinces.value = data
    console.log('Đã tải xong tỉnh:', data.length)
  } catch (error) {
    console.error('Lỗi tải tỉnh thành:', error)
    alert('Không thể kết nối đến server vận chuyển.')
  } finally {
    isLoadingLocation.value = false
  }
})

// 2. Khi chọn Tỉnh -> Load Huyện
stopProvinceWatcher = watch(selectedProvince, async (newVal) => {
  // Reset các cấp con
  districts.value = []
  wards.value = []
  selectedDistrict.value = null
  selectedWard.value = null
  shippingFee.value = 0

  if (newVal) {
    isLoadingLocation.value = true
    try {
      // Gọi Service lấy huyện
      districts.value = await ghnService.getDistricts(newVal)
    } catch (error) {
      console.error('Lỗi tải quận huyện:', error)
    } finally {
      isLoadingLocation.value = false
    }
  }
})

// 3. Khi chọn Huyện -> Load Xã
stopDistrictWatcher = watch(selectedDistrict, async (newVal) => {
  // Reset cấp con
  wards.value = []
  selectedWard.value = null
  shippingFee.value = 0

  if (newVal) {
    isLoadingLocation.value = true
    try {
      // Gọi Service lấy xã
      wards.value = await ghnService.getWards(newVal)
    } catch (error) {
      console.error('Lỗi tải phường xã:', error)
    } finally {
      isLoadingLocation.value = false
    }
  }
})

// 4. Khi chọn Xã -> Tính Phí Ship
stopWardWatcher = watch(selectedWard, async (newVal) => {
  if (newVal && selectedDistrict.value) {
    isCalculatingShip.value = true
    try {
      // Gọi Service tính phí
      const data = await ghnService.calculateFee(selectedDistrict.value, newVal)
      if (data && typeof data.total === 'number') {
        shippingFee.value = data.total
      } else {
        shippingFee.value = 0
        console.warn('Phí vận chuyển trả về không hợp lệ', data)
      }
    } catch (error) {
      console.error('Lỗi tính phí ship:', error)
      alert('Không thể tính phí vận chuyển cho địa chỉ này (Có thể do quá cân hoặc lỗi mạng).')
    } finally {
      isCalculatingShip.value = false
    }
  }
})

const handleOrder = async () => {
  if (!customerName.value || !customerPhone.value || !selectedWard.value || !addressDetail.value) {
    alert('Vui lòng điền đầy đủ thông tin giao hàng.')
    return
  }
  // Dừng tất cả các watcher ngay khi bắt đầu xử lý
  if (stopProvinceWatcher) stopProvinceWatcher()
  if (stopDistrictWatcher) stopDistrictWatcher()
  if (stopWardWatcher) stopWardWatcher()
  isSubmitting.value = true
  try {
    const provinceName = provinces.value.find(
      (p) => p.ProvinceID === selectedProvince.value,
    )?.ProvinceName
    const districtName = districts.value.find(
      (d) => d.DistrictID === selectedDistrict.value,
    )?.DistrictName
    const wardName = wards.value.find((w) => w.WardCode == selectedWard.value)?.WardName
    const fullAddress = `${customerName.value} (${customerPhone.value}), ${addressDetail.value}, ${wardName}, ${districtName}, ${provinceName}`

    //danh sach san pham
    const orderItems = items.value.map((item) => ({
      product_id: item.product.product_id,
      quantity: item.quantity,
    }))
    //phuonng thuc thanh toan
    const paymentMethodId =
      paymentMethod.value === 'cod' ? 1 : paymentMethod.value === 'vnpay' ? 2 : 3 //1 la cod, 2 la vnpay, 3 sepay trong db payment_methods

    //tao payload gui qua server
    const orderData = {
      shipping_address: fullAddress,
      payment_method_id: paymentMethodId,
      shipping_fee: shippingFee.value,
      items: orderItems,
      notes: note.value,
    }
    //gui yeu cau
    const respone = await orderService.createOrder(orderData)
    console.log('Đặt hàng thành công:', respone)

    Swal.fire({
      icon: 'success',
      title: 'Đặt hàng thành công!',
      text: 'Đơn hàng đang chờ nhân viên xác nhận. Vui lòng kiểm tra email hoặc lịch sử đơn hàng.',
      confirmButtonText: 'Xem đơn hàng',
    }).then(() => {
      router.push('/orders')
    })
    //clear gio hang
    cartStore.clearCart()
  } catch (error: any) {
    console.error('Lỗi đặt hàng:', error)
    alert(error.response?.data?.message || 'Đặt hàng thất bại, thử lại sau!')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container py-5">
    <h2 class="mb-4">Thanh Toán</h2>

    <div class="row">
      <div class="col-md-7">
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-white">
            <h5 class="mb-0">Thông tin giao hàng</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Họ tên người nhận <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                v-model="customerName"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
              <input
                type="tel"
                class="form-control"
                v-model="customerPhone"
                placeholder="09xxxxxxx"
                maxlength="10"
                required
              />
            </div>

            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Tỉnh / Thành <span class="text-danger">*</span></label>
                <select
                  class="form-select"
                  v-model="selectedProvince"
                  :disabled="isLoadingLocation"
                >
                  <option :value="null">-- Chọn --</option>
                  <option v-for="p in provinces" :key="p.ProvinceID" :value="p.ProvinceID">
                    {{ p.ProvinceName }}
                  </option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label">Quận / Huyện <span class="text-danger">*</span></label>
                <select
                  class="form-select"
                  v-model="selectedDistrict"
                  :disabled="!selectedProvince || isLoadingLocation"
                >
                  <option :value="null">-- Chọn --</option>
                  <option v-for="d in districts" :key="d.DistrictID" :value="d.DistrictID">
                    {{ d.DistrictName }}
                  </option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label">Phường / Xã <span class="text-danger">*</span></label>
                <select
                  class="form-select"
                  v-model="selectedWard"
                  :disabled="!selectedDistrict || isLoadingLocation"
                >
                  <option :value="null">-- Chọn --</option>
                  <option v-for="w in wards" :key="w.WardCode" :value="w.WardCode">
                    {{ w.WardName }}
                  </option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Địa chỉ chi tiết <span class="text-danger">*</span></label>
              <input
                type="text"
                class="form-control"
                v-model="addressDetail"
                placeholder="Số nhà, tên đường..."
              />
            </div>
            <div class="mb-3">
              <label for="description" class="form-label">Ghi chú(Tùy chọn)</label>
              <textarea class="form-control" id="description" v-model="note" rows="4"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-5">
        <div class="card shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0">Đơn hàng của bạn</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush mb-3">
              <li
                v-for="item in items"
                :key="item.product.product_id"
                class="list-group-item d-flex justify-content-between align-items-center px-0"
              >
                <div class="d-flex align-items-center">
                  <span class="badge bg-secondary rounded-pill me-2">{{ item.quantity }}</span>
                  <div class="text-truncate" style="max-width: 150px">{{ item.product.name }}</div>
                </div>
                <span>{{
                  formatCurrency((item.product.sale_price || item.product.price) * item.quantity)
                }}</span>
              </li>
            </ul>

            <hr />

            <div class="d-flex justify-content-between mb-2">
              <span>Tạm tính:</span>
              <span class="fw-bold">{{ formatCurrency(subTotal) }}</span>
            </div>

            <div class="d-flex justify-content-between mb-2 text-muted">
              <span>Phí vận chuyển:</span>
              <span
                v-if="isCalculatingShip"
                class="spinner-border spinner-border-sm text-primary"
              ></span>
              <span v-else>{{ formatCurrency(shippingFee) }}</span>
            </div>

            <hr />

            <div class="d-flex justify-content-between mb-4">
              <span class="fs-5 fw-bold">Tổng cộng:</span>
              <span class="fs-4 fw-bold text-danger">{{ formatCurrency(totalAmount) }}</span>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold">Phương thức thanh toán</label>

              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="payment"
                  id="cod"
                  value="cod"
                  v-model="paymentMethod"
                />
                <label class="form-check-label" for="cod"> Thanh toán khi nhận hàng (COD) </label>
              </div>

              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="payment"
                  id="vnpay"
                  value="vnpay"
                  v-model="paymentMethod"
                />
                <label class="form-check-label" for="vnpay"> Thanh toán qua VNPay </label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  name="payment"
                  id="sepay"
                  value="sepay"
                  v-model="paymentMethod"
                />
                <label class="form-check-label" for="sepay"> Thanh toán qua sePay </label>
              </div>
            </div>

            <button
              class="btn btn-danger w-100 btn-lg"
              @click="handleOrder"
              :disabled="isCalculatingShip || isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
              <span v-else>Đặt Hàng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
