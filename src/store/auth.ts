import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import type { IAccount } from '@/types/Account'
import type { IUser } from '@/types/User'
import Swal from 'sweetalert2'

interface AuthState {
  user: IAccount | IUser | null
  token: string | null
}
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) =>
      state.user && 'role_id' in state.user ? Number((state.user as any).role_id) === 1 : false, //1 la quan ly, 2 la nhan vien
    isStaff: (state) =>
      state.user && 'role_id' in state.user ? Number((state.user as any).role_id) === 2 : false,
    isUser: (state) => (state.user && 'role' in state.user ? state.user.role === 'user' : false),
  },
  actions: {
    async handleAdminLogin(credentials: any) {
      try {
        const response = await authService.loginAdmin(credentials)
        this.token = response.access_token
        this.user = response.user
        localStorage.setItem('token', response.access_token)
      } catch (error: any) {
        console.error('Lỗi đăng nhập:', error)
        console.log(error.response.data)
        throw new Error('Email hoặc mật khẩu sai!')
      }
    },
    handleLogout() {
      this.user = null
      this.token = null
      localStorage.clear()
    },
    async handleUserLogin(credentials: any) {
      
      try {
        // 1. Gọi API đăng nhập trước
        const response = await authService.loginUser(credentials)

        // 2. Kiểm tra trạng thái khóa (Dựa trên dữ liệu mới nhận về)
        // Lưu ý: Cấu trúc response.user tùy thuộc vào API của bạn trả về
        if (response.user && response.user.is_active === false) {
           throw new Error('Tài khoản của bạn đã bị khóa! Vui lòng liên hệ cửa hàng.')
        }

        // 3. Nếu OK thì mới lưu vào state
        this.token = response.access_token
        this.user = response.user
        localStorage.setItem('token', response.access_token)
        
      } catch (error: any) {
        console.error('Lỗi đăng nhập user:', error)
        const errorMessage = error.response?.data?.message || error.message || 'Email hoặc mật khẩu không chính xác.'
        
        throw new Error(errorMessage)
      }
    },

    async handleRegister(userData: any) {
      try {
        const response = await authService.registerUser(userData)
        // Tự động đăng nhập sau khi đăng ký
        this.token = response.access_token
        this.user = response.user
        localStorage.setItem('token', response.access_token)
      } catch (error: any) {
        // Lấy message chi tiết từ backend (Axios error) nếu có
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Email đã tồn tại hoặc dữ liệu không hợp lệ.'
        console.error('Lỗi đăng ký:', error)
        throw new Error(message)
      }
    },
    async fetchUserProfile() {
      if (this.token) {
        // Chỉ chạy nếu có token
        try {
          const user = await authService.getProfile()
          this.user = user
        } catch (error) {
          // Nếu token hết hạn hoặc không hợp lệ
          console.error('Token không hợp lệ, đang đăng xuất:', error)
          this.handleLogout()
        }
      }
    },
    async handleSocialLogin(token: string) {
      this.token = token
      localStorage.setItem('token', token)
      await this.fetchUserProfile()
    },
  },
})
