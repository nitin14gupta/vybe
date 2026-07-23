export interface AuditLogItem {
  id: string
  action: string
  target_type: string
  target_id: string | null
  detail: string | null
  created_at: string
  admin_id: string
  admin_name: string | null
  admin_email: string
}
