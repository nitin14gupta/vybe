import { RefreshControl, type RefreshControlProps } from 'react-native'
import { Colors } from '@/constants'

interface Props extends Omit<RefreshControlProps, 'refreshing' | 'onRefresh' | 'tintColor' | 'colors' | 'progressBackgroundColor'> {
  refreshing: boolean
  onRefresh: () => void
}

export function BrandedRefreshControl({ refreshing, onRefresh, ...rest }: Props) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.inkSecondary}
      colors={[Colors.inkSecondary]}
      progressBackgroundColor={Colors.surface}
      {...rest}
    />
  )
}
