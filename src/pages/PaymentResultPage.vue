<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const status = ref('')
const orderCode = ref('')
const errorMessage = ref('')
const loading = ref(true)

// Map VNPay response code to message
const getVnpayMessage = (code: string): string => {
  const messages: Record<string, string> = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ.',
    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
    '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Đã hết hạn chờ thanh toán.',
    '12': 'Thẻ/Tài khoản bị khóa.',
    '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP).',
    '24': 'Khách hàng hủy giao dịch',
    '51': 'Tài khoản không đủ số dư.',
    '65': 'Tài khoản vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
    '99': 'Lỗi không xác định',
  }
  return messages[code] || 'Giao dịch thất bại'
}

onMounted(async () => {
  console.log('=== PAYMENT RESULT PAGE ===')
  console.log('All query params:', route.query)

  // Trường hợp 1: Callback từ backend (đã xử lý)
  if (route.query.payment) {
    console.log('Case 1: Backend processed callback')
    status.value = route.query.payment as string
    orderCode.value = route.query.order as string
    errorMessage.value = route.query.message as string
    loading.value = false
    return
  }
  if (route.query.status) {
    console.log('Case 1.1: backend processed callback for sepay')
    status.value = route.query.status as string
    orderCode.value = (route.query.orderCode || route.query.order) as string
    errorMessage.value = route.query.message as string
    loading.value = false
    return
  }

  // Trường hợp 2: Callback trực tiếp từ VNPay (chưa xử lý)
  if (route.query.vnp_ResponseCode) {
    console.log('Case 2: Direct VNPay callback')
    const vnpResponseCode = route.query.vnp_ResponseCode as string
    const vnpTxnRef = route.query.vnp_TxnRef as string
    const vnpAmount = route.query.vnp_Amount as string

    console.log('VNPay Response Code:', vnpResponseCode)
    console.log('VNPay TxnRef:', vnpTxnRef)

    orderCode.value = vnpTxnRef

    // Gọi backend để verify
    try {
      const queryString = new URLSearchParams(route.query as any).toString()
      const response = await fetch(`https://dh52111401.id.vn/vnpay/vnpay_return?${queryString}`)

      if (!response.ok) {
        throw new Error('Verify failed')
      }

      // Backend sẽ redirect, nhưng nếu gọi từ frontend thì xử lý response
      const result = await response.json().catch(() => null)

      if (result && result.isValid && vnpResponseCode === '00') {
        status.value = 'success'
      } else if (vnpResponseCode === '24') {
        status.value = 'cancel'
        errorMessage.value = 'Bạn đã hủy giao dịch'
      } else {
        status.value = 'error'
        errorMessage.value = getVnpayMessage(vnpResponseCode)
      }
    } catch (error) {
      console.error('Verify error:', error)
      // Fallback: chỉ dựa vào response code
      if (vnpResponseCode === '00') {
        status.value = 'success'
      } else if (vnpResponseCode === '24') {
        status.value = 'cancel'
        errorMessage.value = 'Bạn đã hủy giao dịch'
      } else {
        status.value = 'error'
        errorMessage.value = getVnpayMessage(vnpResponseCode)
      }
    }

    loading.value = false
    return
  }

  // Trường hợp 3: Không có tham số gì
  console.log('Case 3: No payment params found')
  status.value = 'unknown'
  loading.value = false
})

const isSuccess = computed(() => status.value === 'success')
const isError = computed(() => status.value === 'error')
const isCancel = computed(() => status.value === 'cancel')
const isUnknown = computed(
  () =>
    status.value === 'unknown' ||
    (!isSuccess.value && !isError.value && !isCancel.value && !loading.value),
)
</script>

<template>
  <div class="container py-5 text-center payment-result">
    <!-- Loading State -->
    <div v-if="loading" class="card shadow-sm d-inline-block p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang xử lý...</span>
      </div>
      <p class="mt-3 text-muted">Đang xác nhận thanh toán...</p>
    </div>

    <!-- Success State -->
    <div v-else-if="isSuccess" class="card shadow-sm d-inline-block p-5">
      <div class="mb-4 text-success">
        <i class="bi bi-check-circle-fill" style="font-size: 5rem"></i>
      </div>
      <h2 class="mb-3 text-success">Thanh Toán Thành Công!</h2>
      <p class="text-muted">Cảm ơn bạn đã mua hàng.</p>
      <p>Đơn hàng của bạn đang được xử lý và sẽ sớm được giao.</p>

      <div v-if="orderCode" class="alert alert-info mt-3">
        <strong>Mã đơn hàng:</strong> {{ orderCode }}
      </div>

      <div class="mt-4 d-flex gap-2 justify-content-center">
        <RouterLink to="/" class="btn btn-outline-secondary">
          <i class="bi bi-house-door"></i> Về trang chủ
        </RouterLink>
        <RouterLink to="/orders" class="btn btn-primary">
          <i class="bi bi-box-seam"></i> Xem đơn hàng của tôi
        </RouterLink>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="isError" class="card shadow-sm d-inline-block p-5">
      <div class="mb-4 text-danger">
        <i class="bi bi-x-circle-fill" style="font-size: 5rem"></i>
      </div>
      <h2 class="mb-3 text-danger">Thanh Toán Thất Bại</h2>
      <p class="text-muted">Giao dịch xảy ra lỗi trong quá trình thanh toán.</p>

      <div v-if="errorMessage" class="alert alert-danger mt-3">
        <strong>Chi tiết lỗi:</strong> {{ errorMessage }}
      </div>

      <div v-if="orderCode" class="alert alert-warning mt-3">
        <strong>Mã đơn hàng:</strong> {{ orderCode }}
      </div>

      <div class="mt-4 d-flex gap-2 justify-content-center">
        <RouterLink to="/" class="btn btn-outline-secondary">
          <i class="bi bi-house-door"></i> Về trang chủ
        </RouterLink>
        <RouterLink to="/cart" class="btn btn-warning">
          <i class="bi bi-cart3"></i> Quay lại giỏ hàng
        </RouterLink>
      </div>
    </div>

    <!-- Cancel State -->
    <div v-else-if="isCancel" class="card shadow-sm d-inline-block p-5">
      <div class="mb-4 text-warning">
        <i class="bi bi-exclamation-triangle-fill" style="font-size: 5rem"></i>
      </div>
      <h2 class="mb-3 text-warning">Thanh Toán Bị Hủy</h2>
      <p class="text-muted">Bạn đã hủy giao dịch thanh toán.</p>

      <div v-if="orderCode" class="alert alert-info mt-3">
        <strong>Mã đơn hàng:</strong> {{ orderCode }}
      </div>

      <div class="mt-4 d-flex gap-2 justify-content-center">
        <RouterLink to="/" class="btn btn-outline-secondary">
          <i class="bi bi-house-door"></i> Về trang chủ
        </RouterLink>
        <RouterLink to="/cart" class="btn btn-primary">
          <i class="bi bi-cart3"></i> Quay lại giỏ hàng
        </RouterLink>
      </div>
    </div>

    <!-- Unknown State -->
    <div v-else-if="isUnknown" class="card shadow-sm d-inline-block p-5">
      <div class="mb-4 text-secondary">
        <i class="bi bi-question-circle-fill" style="font-size: 5rem"></i>
      </div>
      <h2 class="mb-3 text-secondary">Không Xác Định Được Trạng Thái</h2>
      <p class="text-muted">Không thể xác định trạng thái thanh toán.</p>
      <p>Vui lòng kiểm tra lại đơn hàng của bạn hoặc liên hệ hỗ trợ.</p>

      <div class="mt-4 d-flex gap-2 justify-content-center">
        <RouterLink to="/" class="btn btn-outline-secondary">
          <i class="bi bi-house-door"></i> Về trang chủ
        </RouterLink>
        <RouterLink to="/orders" class="btn btn-primary">
          <i class="bi bi-box-seam"></i> Xem đơn hàng
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-result {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  max-width: 600px;
  width: 100%;
  border-radius: 1rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.alert {
  font-size: 0.95rem;
  border-radius: 0.5rem;
}

i.bi {
  line-height: 1;
}
</style>
