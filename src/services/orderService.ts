import apiClient from './apiClient'

export interface CreateOrderPayload {
  shipping_address: string
  payment_method_id: number
  shipping_fee: number
  notes: string | null

  items: {
    product_id: number
    quantity: number
  }[]
}

export const orderService = {
  createOrder(data: CreateOrderPayload) {
    return apiClient.post('/orders', data).then((res) => res.data)
  },
  getMyOrders(page = 1, status = '', sortBy = 'created_at', order = 'DESC') {
    return apiClient.get('/orders', {params: {page, status, sort_by: sortBy, order: order}}).then((res) => res.data)
  },
  createPaymentUrl(data: { amount: number; orderId: string }) {
    return apiClient.post('/vnpay/create_payment_url', data).then((res) => res.data)
  },
  getOrderByCode(orderCode: string) {
    return apiClient.get(`/orders/by-code/${orderCode}`).then((res) => res.data)
  },
  getAllOrders(params: any) {
    return apiClient.get('/orders/admin/all', { params}).then((res) => res.data)
  },
  updateOrderStatus(id: number, status: string) {
    return apiClient.patch(`/orders/admin/${id}/status`, { status }).then((res) => res.data)
  },
  cancelOrder(id: number) {
    return apiClient.patch(`/orders/${id}/cancel`)
  },
}
