"""Single source of truth for app-wide identifiers that must match
client/app.json. Update here, not in the individual files that use them.
"""

# ios.bundleIdentifier and android.package in client/app.json (same value for both)
BUNDLE_ID = "in.vybe.app"
ANDROID_PACKAGE = BUNDLE_ID

# client/app.json's "scheme" — the custom URL scheme (vybe://...)
APP_SCHEME = "vybe"

# client/app.json's iOS associatedDomains / Android intentFilters host —
# see server/routes/wellknown.py for the universal-link verification files
# that must be served from this domain.
UNIVERSAL_LINK_DOMAIN = "vybe.uilora.com"
