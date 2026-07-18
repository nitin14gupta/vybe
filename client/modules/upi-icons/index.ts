import UpiIconsModule from './src/UpiIconsModule'

/**
 * Reads an installed app's launcher icon straight from the device via
 * PackageManager and returns it as a base64-encoded PNG (no data: prefix).
 * Returns null if the app isn't installed or the icon can't be read.
 */
export async function getUpiAppIcon(packageName: string): Promise<string | null> {
  if (!packageName) return null
  try {
    return await UpiIconsModule.getAppIcon(packageName)
  } catch {
    return null
  }
}
