import { Linking } from 'react-native'
import { ConfirmSheet } from './ConfirmSheet'
import { usePermissionSheetStore } from '@/store/permissionSheetStore'

export function PermissionSheetOverlay() {
  const { visible, title, body, hide } = usePermissionSheetStore()

  return (
    <ConfirmSheet
      visible={visible}
      title={title}
      body={body}
      confirmLabel="Open Settings"
      onConfirm={() => Linking.openSettings()}
      onClose={hide}
    />
  )
}
