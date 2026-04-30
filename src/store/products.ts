import { defineStore } from 'pinia'
import { productService } from '@/services/productService'
import type { IProduct } from '@/types/Product'

//khoi tao state
interface ProductState {
  products: IProduct[]
  selectedProduct: IProduct | null
  isLoading: boolean
  error: string | null
}
export const useProductStore = defineStore('products', {
  state: (): ProductState => ({
    products: [],
    selectedProduct: null,
    isLoading: false,
    error: null,
  }),
  //goi API
  actions: {
    async fetchProducts() {
      this.isLoading = true
      this.error = null
      try {
        //goi service
        const res = await productService.getProducts()

        this.products = res.data
      } catch (err: any) {
        this.error = err.message || 'Có lỗi khi tải sản phẩm'
      } finally {
        this.isLoading = false
      }
    },
    async fetchProductById(id: number) {
      this.isLoading = true
      this.error = null
      this.selectedProduct = null //bo san pham da click
      try {
        const data = await productService.getProductById(id)
        this.selectedProduct = data
      } catch (err: any) {
        this.error = err.message || 'Không tìm thấy sản phẩm'
      } finally {
        this.isLoading = false
      }
    },
  },
})
