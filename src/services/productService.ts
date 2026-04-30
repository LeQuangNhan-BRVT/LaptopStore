import apiClient from './apiClient'
import type { IProduct, IProductSpecification } from '@/types/Product'

interface PaginatedResult {
  data: IProduct[]
  meta: { total: number; page: number; limit: number; last_page: number }
}
export const productService = {
  getProductBySlug(slug: string): Promise<IProduct> {
    return apiClient.get(`/products/${slug}`).then((response) => response.data)
  },
  getProductById(id: number): Promise<IProduct> {
    return apiClient.get(`/products/id/${id}`).then((response) => response.data)
  },
  // Tạo sản phẩm mới (admin only)
  createProduct(formData: FormData): Promise<IProduct> {
    return apiClient.post('/products', formData).then((response) => response.data)
  },
  updateProduct(id: number, formData: Partial<IProduct>): Promise<IProduct> {
    return apiClient.patch(`/products/${id}`, formData).then((res) => res.data)
  },
  addImages(id: number, formData: FormData): Promise<any> {
    return apiClient.post(`/products/${id}/images`, formData).then((response) => response.data)
  },
  getSpecs(id: number): Promise<IProductSpecification> {
    return apiClient.get(`/products/${id}/specs`).then((res) => res.data)
  },
  updateOrCreateSpecs(
    id: number,
    formData: Partial<IProductSpecification>,
  ): Promise<IProductSpecification> {
    return apiClient.patch(`/products/${id}/specs`, formData).then((response) => response.data)
  },
  deleteProduct(id: number): Promise<void> {
    return apiClient.delete(`/products/${id}`)
  },
  getProducts(params: any = {}): Promise<PaginatedResult> {
    return apiClient.get('/products/search', { params }).then((res) => res.data)
  },
}
