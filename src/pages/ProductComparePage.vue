<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService } from '@/services/productService'

declare const puter: any

const route = useRoute()
const router = useRouter()

const product1 = ref<any>(null)
const product2 = ref<any>(null)
interface IAIAnalysis {
  performance: string
  portability: string
  audience: string
  conclusion: string
}

const aiResult = ref<IAIAnalysis | null>(null)
const isLoading = ref(false)
const isAnalyzing = ref(false)

// Hàm format tiền
const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ'

// Helper lấy danh sách tag thành chuỗi
const getTags = (p: any) => {
  if (p.product_tag && p.product_tag.length > 0) {
    return p.product_tag.map((t: any) => t.name).join(', ')
  }
  return 'Không có'
}

onMounted(async () => {
  const p1Id = route.query.p1
  const p2Id = route.query.p2

  if (!p1Id || !p2Id) {
    alert('Cần chọn 2 sản phẩm để so sánh!')
    router.push('/')
    return
  }

  isLoading.value = true
  try {
    const [res1, res2] = await Promise.all([
      productService.getProductById(Number(p1Id)),
      productService.getProductById(Number(p2Id)),
    ])
    product1.value = res1
    product2.value = res2
  } catch (error) {
    console.error(error)
    alert('Không thể tải dữ liệu sản phẩm')
  } finally {
    isLoading.value = false
  }
})

const analyzeWithAI = async () => {
  if (!product1.value || !product2.value) return
  isAnalyzing.value = true
  aiResult.value = null

  try {
    const prompt = `
      Tôi muốn so sánh 2 laptop này. Hãy đóng vai chuyên gia công nghệ và trả về kết quả dưới dạng JSON chuẩn (không được có markdown block, chỉ trả về raw JSON).
      
      Sản phẩm Thứ nhất: ${product1.value.name}
       - Giá: ${formatPrice(product1.value.sale_price || product1.value.price)}
       - CPU: ${product1.value.specification?.cpu}, RAM: ${product1.value.specification?.ram}, GPU: ${product1.value.specification?.gpu}
       - Tags: ${getTags(product1.value)}

      Sản phẩm Thứ hai: ${product2.value.name}
       - Giá: ${formatPrice(product2.value.sale_price || product2.value.price)}
       - CPU: ${product2.value.specification?.cpu}, RAM: ${product2.value.specification?.ram}, GPU: ${product2.value.specification?.gpu}
       - Tags: ${getTags(product2.value)}

      Yêu cầu cấu trúc JSON trả về (các value viết bằng tiếng Việt, ngắn gọn, súc tích):
      {
        "performance": "So sánh hiệu năng...",
        "portability": "So sánh tính di động/pin...",
        "audience": "Đối tượng phù hợp cho từng máy...",
        "conclusion": "Kết luận ai nên mua máy nào..."
      }
    `

    // Gọi Puter
    const response = await puter.ai.chat(prompt)
    let rawConTent = response?.message?.content || ''
    rawConTent = rawConTent
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    aiResult.value = JSON.parse(rawConTent)
  } catch (error) {
    console.error('Loi phan tich AI: ', error)
    aiResult.value = {
      performance: 'Không thể phân tích data',
      portability: '',
      audience: '',
      conclusion: 'Lỗi kết nối hoặc sai định dạng data',
    }
  } finally {
    isAnalyzing.value = false
  }
}
</script>

<template>
  <div class="container py-5">
    <h2 class="text-center mb-5 fw-bold text-primary">SO SÁNH SẢN PHẨM</h2>

    <div v-if="isLoading" class="text-center">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else-if="product1 && product2" class="row g-4">
      <div class="col-md-4">
        <div class="card h-100 shadow-sm border-0">
          <img
            :src="product1.images?.[0]?.image_url"
            class="card-img-top p-3"
            style="height: 200px; object-fit: contain"
          />
          <div class="card-body">
            <h5 class="card-title fw-bold">{{ product1.name }}</h5>
            <p class="text-danger fs-5 fw-bold">
              {{ formatPrice(product1.sale_price || product1.price) }}
            </p>

            <div class="mb-3">
              <span
                v-for="t in product1.product_tag"
                :key="t.tag_id"
                class="badge bg-info text-dark me-1"
              >
                {{ t.name }}
              </span>
            </div>

            <ul class="list-group list-group-flush small">
              <li class="list-group-item"><b>CPU:</b> {{ product1.specification?.cpu }}</li>
              <li class="list-group-item"><b>RAM:</b> {{ product1.specification?.ram }}</li>
              <li class="list-group-item"><b>GPU:</b> {{ product1.specification?.gpu }}</li>
              <li class="list-group-item"><b>Màn hình:</b> {{ product1.specification?.screen }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-md-4 d-flex flex-column align-items-center justify-content-center">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
          width="80"
          class="mb-3"
          alt="VS"
        />

        <button
          @click="analyzeWithAI"
          class="btn btn-warning btn-lg text-white fw-bold shadow-sm mb-3"
          :disabled="isAnalyzing"
        >
          <span v-if="isAnalyzing" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-stars"></i>
          PHÂN TÍCH NGAY
        </button>
        <p class="text-muted text-center small px-4">
          Sử dụng trí tuệ nhân tạo để phân tích dựa trên cấu hình sản phẩm phù hợp với người dùng.
        </p>
      </div>

      <div class="col-md-4">
        <div class="card h-100 shadow-sm border-0">
          <img
            :src="product2.images?.[0]?.image_url"
            class="card-img-top p-3"
            style="height: 200px; object-fit: contain"
          />
          <div class="card-body">
            <h5 class="card-title fw-bold">{{ product2.name }}</h5>
            <p class="text-danger fs-5 fw-bold">
              {{ formatPrice(product2.sale_price || product2.price) }}
            </p>

            <div class="mb-3">
              <span
                v-for="t in product2.product_tag"
                :key="t.tag_id"
                class="badge bg-info text-dark me-1"
              >
                {{ t.name }}
              </span>
            </div>

            <ul class="list-group list-group-flush small">
              <li class="list-group-item"><b>CPU:</b> {{ product2.specification?.cpu }}</li>
              <li class="list-group-item"><b>RAM:</b> {{ product2.specification?.ram }}</li>
              <li class="list-group-item"><b>GPU:</b> {{ product2.specification?.gpu }}</li>
              <li class="list-group-item"><b>Màn hình:</b> {{ product2.specification?.screen }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-12 mt-4" v-if="aiResult">
        <div class="card border-0 shadow-sm overflow-hidden">
          <div class="card-header bg-gradient bg-primary text-white p-3">
            <h5 class="mb-0 fw-bold"><i class="bi bi-robot me-2"></i> GÓC NHÌN CHUYÊN GIA AI</h5>
          </div>
          <div class="card-body bg-light">
            <div class="row g-3">
              <div class="col-md-6">
                <div
                  class="p-3 bg-white rounded shadow-sm h-100 border-start border-4 border-danger"
                >
                  <h6 class="fw-bold text-danger"><i class="bi bi-speedometer2"></i> Hiệu Năng</h6>
                  <p class="mb-0 text-secondary text-justify">{{ aiResult.performance }}</p>
                </div>
              </div>

              <div class="col-md-6">
                <div class="p-3 bg-white rounded shadow-sm h-100 border-start border-4 border-info">
                  <h6 class="fw-bold text-info">
                    <i class="bi bi-briefcase"></i> Tính Di Động & Pin
                  </h6>
                  <p class="mb-0 text-secondary text-justify">{{ aiResult.portability }}</p>
                </div>
              </div>

              <div class="col-12">
                <div class="p-3 bg-white rounded shadow-sm border-start border-4 border-warning">
                  <h6 class="fw-bold text-warning">
                    <i class="bi bi-people-fill"></i> Đối Tượng Phù Hợp
                  </h6>
                  <p class="mb-0 text-secondary">{{ aiResult.audience }}</p>
                </div>
              </div>

              <div class="col-12">
                <div class="p-3 bg-success bg-opacity-10 rounded border border-success">
                  <h6 class="fw-bold text-success mb-2">
                    <i class="bi bi-check-circle-fill"></i> TỔNG KẾT & LỜI KHUYÊN
                  </h6>
                  <p class="mb-0 fw-medium">{{ aiResult.conclusion }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer text-muted small text-center fst-italic">
            * Kết quả được tạo tự động bởi AI và chỉ mang tính chất tham khảo.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
