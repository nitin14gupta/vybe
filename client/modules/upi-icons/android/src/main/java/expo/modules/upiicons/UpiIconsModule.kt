package expo.modules.upiicons

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

// Reads an installed app's real launcher icon straight from the device via
// PackageManager — the same thing every UPI intent picker (GPay, PhonePe,
// Zomato, Zepto, ...) does. No bundled or hotlinked brand logos involved.
class UpiIconsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("UpiIcons")

    AsyncFunction("getAppIcon") { packageName: String ->
      readIconBase64(packageName)
    }
  }

  private fun readIconBase64(packageName: String): String? {
    val context = appContext.reactContext ?: return null
    return try {
      val drawable = context.packageManager.getApplicationIcon(packageName)
      val bitmap = drawableToBitmap(drawable)
      val stream = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
      Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    } catch (e: Exception) {
      null
    }
  }

  private fun drawableToBitmap(drawable: Drawable): Bitmap {
    if (drawable is BitmapDrawable && drawable.bitmap != null) {
      return drawable.bitmap
    }
    val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
    val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, canvas.width, canvas.height)
    drawable.draw(canvas)
    return bitmap
  }
}
