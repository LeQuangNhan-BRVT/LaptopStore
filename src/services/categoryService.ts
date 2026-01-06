import apiClient from "./apiClient";
import type { ICategories } from "@/types/Category";

export const categoryService = {

    getCategories(): Promise<ICategories[]>{
        return apiClient.get('/categories').then(res => res.data)
    },
    createCategory(name: string, description: string): Promise<ICategories>{
        return apiClient.post('/categories', {name, description}).then(res => res.data)
    },
    deleteCategory(id: number): Promise<void>{
        return apiClient.delete(`/categories/${id}`)
      }
}
