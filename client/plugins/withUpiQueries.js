const { withAndroidManifest } = require('@expo/config-plugins')

// Android 11+ requires <queries> in AndroidManifest to see apps that handle upi:// intents.
// Without this, PackageManager.queryIntentActivities() returns empty — no UPI apps visible.
module.exports = function withUpiQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest

    if (!manifest.queries) {
      manifest.queries = []
    }

    // Check if already added (idempotent)
    const already = manifest.queries.some(
      (q) => q?.intent?.[0]?.data?.[0]?.['$']?.['android:scheme'] === 'upi'
    )

    if (!already) {
      manifest.queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': 'upi' } }],
          },
        ],
      })
    }

    return config
  })
}
