import apiClient from './apiClient'
import type { IAccount } from '@/types/Account'
import type { IUser } from '@/types/User'
interface AdminLoginCredentials {
  email: string
  password: string
}
interface AdminLoginResponse {
  access_token: string
  user: IAccount
}
interface UserLoginCredentials {
  email: string
  password: string
}
interface RegisterPayload {
  full_name: string
  email: string
  password: string
  phone_number?: string
}
interface UserAuthResponse {
  access_token: string
  user: IUser
}
export const authService = {
  loginAdmin(credentials: AdminLoginCredentials): Promise<AdminLoginResponse> {
    return apiClient.post('/auth/admin/login', credentials).then((response) => response.data)
  },
  loginUser(credentials: UserLoginCredentials): Promise<UserAuthResponse> {
    return apiClient.post('/auth/login', credentials).then((response) => response.data)
  },
  registerUser(payload: RegisterPayload): Promise<UserAuthResponse> {
    return apiClient.post('/auth/register', payload).then((response) => response.data)
  },
  getProfile(): Promise<any> {
    return apiClient.get('/auth/profile').then((response) => response.data)
  },
  updateProfile(data: any): Promise<any> {
    return apiClient.patch('/users/profile', data).then((res) => res.data)
  },
  forgotPassword(email: string) {
    return apiClient.post('/auth/forgot-password', email).then(res => res.data)
  },
  resetPassword(token: string, newPassword: string) {
    return apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    })
  },
}
