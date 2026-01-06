<script setup lang="ts">
import { useCompareStore } from '@/store/compare'
import { useRouter } from 'vue-router'

const compareStore = useCompareStore()
const router = useRouter()

const goToComparePage = () => {
  if (compareStore.count === 2) {
    router.push(compareStore.compareUrl)
  }
}
</script>

<template>
  <div v-if="compareStore.count > 0" class="compare-bar shadow-lg">
    <div class="container d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-3">
        <span class="fw-bold text-white d-none d-md-block"
          >So sánh ({{ compareStore.count }}/2):</span
        >

        <div v-for="item in compareStore.items" :key="item.product_id" class="position-relative">
          <img
            :src="item.images?.[0]?.image_url"
            class="img-thumbnail rounded-circle"
            style="width: 50px; height: 50px; object-fit: cover"
          />
          <button
            @click="compareStore.removeItem(item.product_id)"
            class="btn-remove badge bg-danger rounded-circle"
          >
            x
          </button>
        </div>

        <div
          v-if="compareStore.count < 2"
          class="placeholder-circle d-flex align-items-center justify-content-center text-white-50"
        >
          <i class="bi bi-plus-lg"></i>
        </div>
      </div>

      <div>
        <button v-if="compareStore.count < 2" class="btn btn-light btn-sm disabled">
          Chọn thêm 1 sản phẩm
        </button>
        <button v-else @click="goToComparePage" class="btn btn-warning fw-bold shadow">
          <i class="bi bi-stars"></i> SO SÁNH NGAY
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compare-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(33, 37, 41, 0.95); /* Màu tối, hơi trong suốt */
  padding: 15px 0;
  z-index: 1050; /* Cao hơn các thành phần khác */
  border-top: 3px solid #ffc107;
  animation: slideUp 0.3s ease-out;
}

.btn-remove {
  position: absolute;
  top: -5px;
  right: -5px;
  border: none;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.placeholder-circle {
  width: 50px;
  height: 50px;
  border: 2px dashed #6c757d;
  border-radius: 50%;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
