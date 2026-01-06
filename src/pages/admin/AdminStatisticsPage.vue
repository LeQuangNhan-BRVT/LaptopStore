<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { statisticsService } from '@/services/statisticsService'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement, // Thêm Line
  PointElement, // Thêm Point (các chấm trên đường)
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Chart } from 'vue-chartjs'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

// Đăng ký các thành phần cho Combo Chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
)

const isLoading = ref(false)

// --- STATE FILTER ---
const filterType = ref('month') // 'month', 'quarter', 'year', 'week'
const filterYear = ref(new Date().getFullYear())
// Lưu ý: Tháng trong JS là 0-11, nên khi gửi lên server cần +1, nhưng để binding vào select ta dùng 1-12 luôn
const filterMonth = ref(new Date().getMonth() + 1)
const filterWeek = ref(1) // Mặc định tuần 1

const statsData = ref<any[]>([])

// Dữ liệu tĩnh cho Dropdown
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const weeks = [1, 2, 3, 4, 5] // 1 tháng tối đa 5-6 tuần

// --- COMPUTED DATA ---
const totalRevenue = computed(() => {
  return statsData.value.reduce((sum, item) => sum + item.revenue, 0)
})

const totalOrders = computed(() => {
  return statsData.value.reduce((sum, item) => sum + item.order_count, 0)
})

// --- CẤU HÌNH COMBO CHART (Cột + Đường) ---
const chartData = computed(() => ({
  labels: statsData.value.map((item) => item.label),
  datasets: [
    {
      type: 'bar' as const,
      label: 'Doanh thu (VNĐ)',
      backgroundColor: 'rgba(13, 110, 253, 0.7)', // Màu xanh bootstrap (nhạt hơn chút)
      borderColor: '#0d6efd',
      borderWidth: 1,
      data: statsData.value.map((item) => item.revenue),
      borderRadius: 4,
      order: 2, // Vẽ sau (nằm dưới)
      yAxisID: 'y', // Gán vào trục Y bên trái
    },
    {
      type: 'line' as const,
      label: 'Số đơn hàng',
      borderColor: '#dc3545', // Màu đỏ bootstrap
      backgroundColor: '#dc3545',
      data: statsData.value.map((item) => item.order_count),
      tension: 0.3, // Độ cong của đường
      pointRadius: 4, // Kích thước chấm tròn
      pointHoverRadius: 6,
      order: 1, // Vẽ trước (nằm đè lên cột)
      yAxisID: 'y1', // Gán vào trục Y bên phải
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const, // Hover vào 1 điểm hiện tooltip cả 2
    intersect: false,
  },
  plugins: {
    legend: { position: 'top' as const },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.dataset.type === 'bar') {
            // Format tiền cho cột Doanh thu
            label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              context.raw,
            )
          } else {
            // Format số thường cho Line Đơn hàng
            label += context.raw + ' đơn'
          }
          return label
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false }, // Ẩn lưới dọc cho đẹp
    },
    // Trục Y trái (Doanh thu)
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: { display: true, text: 'Doanh thu' },
      ticks: {
        callback: function (value: any) {
          if (value >= 1000000000) return (value / 1000000000).toFixed(1) + ' Tỷ'
          if (value >= 1000000) return (value / 1000000).toFixed(0) + ' Tr'
          return value
        },
      },
    },
    // Trục Y phải (Số đơn)
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: { display: true, text: 'Số đơn hàng' },
      grid: {
        drawOnChartArea: false, // Không vẽ lưới ngang của trục này đè lên lưới trục kia
      },
      ticks: {
        stepSize: 1, // Chỉ hiện số nguyên (không hiện 1.5 đơn)
      },
    },
  },
}

// --- HÀM GỌI API ---
const fetchData = async () => {
  isLoading.value = true
  try {
    // Gọi API với đầy đủ tham số
    // Backend service đã update: getRevenue(type, year, month, week)
    const data = await statisticsService.getRevenue(
      filterType.value,
      filterYear.value,
      filterMonth.value,
      filterWeek.value,
    )
    statsData.value = data
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

// Watch để tự động tải lại khi đổi bất kỳ filter nào
watch([filterType, filterYear, filterMonth, filterWeek], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="container-fluid py-4" v-if="authStore.isAdmin">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold text-primary"><i class="bi bi-graph-up-arrow"></i> Thống kê doanh thu</h3>
      <button class="btn btn-outline-primary btn-sm" @click="fetchData">
        <i class="bi bi-arrow-clockwise"></i> Cập nhật
      </button>
    </div>

    <div class="card shadow-sm mb-4 border-0">
      <div class="card-body bg-light rounded-3">
        <div class="row g-3 align-items-end">
          <div class="col-auto">
            <label class="form-label fw-bold text-muted small">Loại báo cáo:</label>
            <select v-model="filterType" class="form-select border-primary">
              <option value="week">Theo Tuần (Chi tiết ngày)</option>
              <option value="month">Theo Tháng (Chi tiết 12 tháng)</option>
              <option value="quarter">Theo Quý</option>
              <option value="year">Theo Năm (5 năm)</option>
            </select>
          </div>

          <div class="col-auto" v-if="filterType !== 'year'">
            <label class="form-label fw-bold text-muted small">Năm:</label>
            <select v-model="filterYear" class="form-select">
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>

          <div class="col-auto" v-if="filterType === 'week'">
            <label class="form-label fw-bold text-muted small">Tháng:</label>
            <select v-model="filterMonth" class="form-select">
              <option v-for="m in months" :key="m" :value="m">Tháng {{ m }}</option>
            </select>
          </div>

          <div class="col-auto" v-if="filterType === 'week'">
            <label class="form-label fw-bold text-muted small">Tuần thứ:</label>
            <select v-model="filterWeek" class="form-select">
              <option v-for="w in weeks" :key="w" :value="w">Tuần {{ w }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="card shadow-sm border-start border-4 border-primary h-100">
          <div class="card-body d-flex align-items-center">
            <div class="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
              <i class="bi bi-currency-dollar fs-3 text-primary"></i>
            </div>
            <div>
              <div class="text-muted small fw-bold text-uppercase">Tổng Doanh Thu</div>
              <div class="fs-2 fw-bold text-primary">{{ formatCurrency(totalRevenue) }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card shadow-sm border-start border-4 border-danger h-100">
          <div class="card-body d-flex align-items-center">
            <div class="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
              <i class="bi bi-cart-check fs-3 text-danger"></i>
            </div>
            <div>
              <div class="text-muted small fw-bold text-uppercase">Tổng Đơn Hàng</div>
              <div class="fs-2 fw-bold text-danger">{{ totalOrders }} đơn</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card shadow-sm h-100 border-0">
          <div class="card-header bg-white fw-bold py-3">
            <i class="bi bi-bar-chart-line-fill text-primary me-2"></i>
            Biểu đồ tăng trưởng
          </div>
          <div class="card-body" style="height: 450px; position: relative">
            <div
              v-if="isLoading"
              class="d-flex h-100 align-items-center justify-content-center bg-white bg-opacity-75"
              style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 10"
            >
              <div class="spinner-border text-primary"></div>
            </div>
            <Chart v-else type="bar" :data="chartData" :options="chartOptions" />
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card shadow-sm h-100 border-0">
          <div class="card-header bg-white fw-bold py-3">
            <i class="bi bi-table text-primary me-2"></i>
            Chi tiết số liệu
          </div>
          <div class="card-body p-0 table-responsive" style="max-height: 450px">
            <table class="table table-hover table-striped mb-0 align-middle">
              <thead class="table-light sticky-top">
                <tr>
                  <th class="ps-3">Thời gian</th>
                  <th class="text-center">Đơn hàng</th>
                  <th class="text-end pe-3">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in statsData" :key="index">
                  <td class="ps-3 fw-medium text-nowrap">{{ item.label }}</td>
                  <td class="text-center">
                    <span class="badge bg-danger rounded-pill">{{ item.order_count }}</span>
                  </td>
                  <td class="text-end pe-3 fw-bold text-primary small">
                    {{ formatCurrency(item.revenue) }}
                  </td>
                </tr>
                <tr v-if="statsData.length === 0">
                  <td colspan="3" class="text-center py-4 text-muted">Không có dữ liệu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
