import apiClient from "./apiClient";

export const userService = {

    getUsers(page = 1, keyword = ''){
        return apiClient.get('/users/admin/list', {params: {page, keyword}}).then( res => res.data)
    },
    toggleLockUser(id: number){
        return apiClient.patch(`/users/admin/${id}/toggle-lock`).then(res =>res.data)
    }


}


