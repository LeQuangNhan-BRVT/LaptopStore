import apiClient from './apiClient'

export const paymentService = {
  createSepayPayment(data: { invoiceNumber: string; amount: number }) {
    return apiClient.post('/payment/sepay/create', data).then(res => res.data)
  }
}
