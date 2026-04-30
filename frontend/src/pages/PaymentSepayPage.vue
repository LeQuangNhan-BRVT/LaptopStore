<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { paymentService } from '@/services/paymentService'

const route = useRoute()
const loading = ref(true)
const errorMessage = ref('')
const formFields = ref<any>(null)
const checkoutUrl = ref<string>('')

onMounted(async () => {
  const orderCode = route.query.orderCode as string
  const amount = Number(route.query.amount)

  if (!orderCode || !amount) {
    errorMessage.value = 'Thông tin đơn hàng không hợp lệ.'
    loading.value = false
    return
  }

  try {
    const response = await paymentService.createSepayPayment({
      invoiceNumber: orderCode,
      amount: amount
    })

    checkoutUrl.value = response.checkoutUrl
    formFields.value = response.formFields

    // Tạo form dynamic rồi submit
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = checkoutUrl.value

    Object.entries(formFields.value).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value as string
      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
  } catch (err: any) {
    console.error(err)
    errorMessage.value = err.response?.data?.message || 'Không tạo được phiên thanh toán SePay.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container py-5 text-center">
    <h2>Đang chuyển đến SePay...</h2>

    <div v-if="loading" class="mt-3">
      <div class="spinner-border text-primary"></div>
    </div>

    <p v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</p>

    <p v-if="!loading && !errorMessage">Vui lòng chờ...</p>
  </div>
</template>
