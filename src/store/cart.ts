import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { IProduct } from '@/types/Product'
import Swal from 'sweetalert2'

export interface CartItem {
  product: IProduct
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  //tao ds san pham
  const items = ref<CartItem[]>([])
  //reload san pham khi F5
  const initCart = () => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        items.value = JSON.parse(savedCart)
      } catch (e) {
        localStorage.removeItem('cart')
      }
    }
  }
  //Getters
  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  //tong tien tam tinh
  const subTotal = computed(() => {
    return items.value.reduce((total, item) => {
      const price = item.product.sale_price ?? item.product.price //lay gia khuyen mai truoc
      return total + price * item.quantity
    }, 0)
  })

  //them vao gio hang
  const addToCart = (product: IProduct, quantity: number) => {
    if (!checkQuantity(product, quantity)) {
      return
    }
    const existingItem = items.value.find((item) => item.product.product_id === product.product_id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({ product, quantity })
    }
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    })
    Toast.fire({ icon: 'success', title: 'Đã thêm vào giỏ hàng!' })
  }

  const checkQuantity = (productId: IProduct, quantity: number): boolean => {
    const existingItem = items.value.find(
      (item) => item.product.product_id === productId.product_id,
    )
    if (quantity <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi số lượng',
        text: `Kiểm tra lại số lượng bạn muốn mua!`,
      })
      return false
    }
    const currentQtyInCart = existingItem ? existingItem.quantity : 0
    const totalWanaBuy = currentQtyInCart + quantity
    if (totalWanaBuy > productId.quantity) {
      Swal.fire({
        icon: 'error',
        title: 'Hết hàng',
        text: `Cửa hàng chỉ còn ${productId.quantity} sản phẩm này`,
      })
      return false
    }
    return true
  }

  //xoa san pham khoi gio hang
  const removeFromCart = (productId: number) => {
    const index = items.value.findIndex((item) => item.product.product_id === productId)
    if (index != -1) {
      items.value.splice(index, 1)
    }
  }

  const updateQuantity = (productId: number, quantity: number) => {
    const item = items.value.find((item) => item.product.product_id === productId)
    if (item) {
      if (quantity > item.product.quantity) {
        Swal.fire('Quá số lượng tồn kho')
        item.quantity = item.product.quantity // cho về max tồn kho
        return
      }
      item.quantity = quantity
      if (item.quantity <= 0) {
        removeFromCart(productId)
      }
    }
  }
  const clearCart = () => {
    items.value = []
  }

  //dung watcher luu tu dong khi co thay doi
  watch(
    items,
    (newItems) => {
      localStorage.setItem('cart', JSON.stringify(newItems))
    },
    { deep: true },
  )

  //khoi chay
  initCart()

  return {
    items,
    totalItems,
    subTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkQuantity,
  }
})
