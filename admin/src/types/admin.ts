export interface AdminUser {
  adminId: string
  email: string
  name: string | null
  role: string
}

export interface AdminTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  admin_id: string
  name: string | null
  email: string
  role: string
}
