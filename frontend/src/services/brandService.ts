import apiClient from "./apiClient";
import type { IBrand } from "@/types/Brand";

export const brandService = {
    getBrands(): Promise<IBrand[]>{
        return apiClient.get('/brands').then(res => res.data);
    },
    createBrand(formData: FormData): Promise<IBrand>{
        return apiClient.post('/brands', formData).then(res => res.data)
    },
    updateBrand(name: string): Promise<IBrand>{
        return apiClient.put('/brands', {name}).then(res => res.data)
    },
    deleteBrand(id: number): Promise<void>{
        return apiClient.delete(`/brands/${id}`)
      }




}

