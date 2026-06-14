import ApiService from './apiService'
export type { TokenResponse } from './apiService'

export const sendOTP = (phone: string) => ApiService.sendOTP(phone)
export const verifyOTP = (phone: string, code: string) => ApiService.verifyOTP(phone, code)
export const refreshToken = (token: string) => ApiService.refreshToken(token)
export const logout = (token: string) => ApiService.logout(token)
