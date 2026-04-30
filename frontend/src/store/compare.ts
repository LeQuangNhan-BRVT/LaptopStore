import { defineStore } from 'pinia'
import type { IProduct } from '@/types/Product'
import Swal from 'sweetalert2'


export const useCompareStore = defineStore('compare', {
  state: () => ({
    // Lấy từ localStorage nếu có
    items: JSON.parse(localStorage.getItem('compare_items') || '[]') as IProduct[]
  }),

  getters: {
    count: (state) => state.items.length,
    // Kiểm tra xem 1 sản phẩm đã có trong list chưa
    hasItem: (state) => (id: number) => state.items.some(i => i.product_id === id),
    // Link để chuyển hướng
    compareUrl: (state) => {
      if (state.items.length < 2) return ''
      
      return `/compare?p1=${state.items[0]?.product_id}&p2=${state.items[1]?.product_id}`
    }
  },

  actions: {
    toggleProduct(product: IProduct) {
      const index = this.items.findIndex(i => i.product_id === product.product_id)

      if (index > -1) {
        // Nếu có rồi thì xóa (Uncheck)
        this.items.splice(index, 1)
        this.syncToLocal()
        Swal.fire({
            toast: true, position: 'top-end', icon: 'info', 
            title: 'Đã bỏ khỏi danh sách so sánh', showConfirmButton: false, timer: 1500
        })
      } else {
        // Nếu chưa có thì thêm
        if (this.items.length >= 2) {
          Swal.fire({
            icon: 'warning',
            title: 'Giới hạn so sánh',
            text: 'Bạn chỉ có thể so sánh tối đa 2 sản phẩm cùng lúc!',
          })
          return
        }

        this.items.push(product)
        this.syncToLocal()
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', 
            title: 'Đã thêm vào so sánh', showConfirmButton: false, timer: 1500
        })
      }
    },

    removeItem(id: number) {
      this.items = this.items.filter(i => i.product_id !== id)
      this.syncToLocal()
    },

    clearCompare() {
      this.items = []
      this.syncToLocal()
    },

    syncToLocal() {
      localStorage.setItem('compare_items', JSON.stringify(this.items))
    }
  }
})