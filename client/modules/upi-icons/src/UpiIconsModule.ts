import { NativeModule, requireNativeModule } from 'expo'

declare class UpiIconsModule extends NativeModule<{}> {
  getAppIcon(packageName: string): Promise<string | null>
}

export default requireNativeModule<UpiIconsModule>('UpiIcons')
