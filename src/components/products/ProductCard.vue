<script setup lang="ts">
import type { IProduct } from '@/types/Product'
import { computed } from 'vue'
const props = defineProps<{
  product: IProduct
}>()

const displayPrice = computed(() => {
  const price = props.product.sale_price ?? props.product.price
  return price
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const discountPercent = computed(() => {
  if (props.product.sale_price) {
    const percent = Math.round(
      ((props.product.price - props.product.sale_price) / props.product.price) * 100,
    )
    return `-${percent}%`
  }
  return null
})

const originalPrice = computed(() => {
  if (props.product.sale_price) {
    return props.product.price
  }
  return null
})
</script>

<template>
  <div class="card product-card h-100 shadow-sm border-0">
    <span v-if="discountPercent" class="badge bg-danger position-absolute top-0 end-0 m-2">
      {{ discountPercent }}
    </span>
    <img :src="product.primary_image ?? ''" class="card-img-top p-3" :alt="product.name" />
    <div class="card-body d-flex flex-column">
      <h5 class="card-title h6">
        <router-link
          :to="{ name: 'product-detail', params: { slug: product.slug } }"
          class="text-decoration-none text-dark stretched-link"
          >{{ product.name }}</router-link
        >
      </h5>
      <div class="mt-auto">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <span class="fs-5 fw-bold text-danger">{{ formatCurrency(displayPrice) }}</span>
            <span class="ms-2 text-muted text-decoration-line-through small">{{
              originalPrice ? formatCurrency(originalPrice) : ''
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  transition:
    transform 0.2 ease-in-out,
    box-shadow 0.2 ease-in-out;
}
.product-card:hover {
  transform: translate(-5px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}
.card-img-top {
  aspect-ratio: 1 / 1;
  object-fit: contain;
}
.card-title {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 40px;
}
.card-tile .stretched-link::after {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  content: '';
}
</style>
