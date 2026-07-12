from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app_config import BUNDLE_ID, ANDROID_PACKAGE

router = APIRouter()

# ── Universal link verification files ─────────────────────────────────────────
# These must be reachable, unauthenticated, over HTTPS at
# https://<UNIVERSAL_LINK_DOMAIN>/.well-known/apple-app-site-association and
# https://<UNIVERSAL_LINK_DOMAIN>/.well-known/assetlinks.json (see app_config.py
# for the actual domain value) — i.e. this server needs to be the thing that
# domain's DNS actually points at.
#
# Deep-linkable paths below must stay in sync with client/src/lib/deepLink.ts's
# parseIncomingUrl — that's what maps an incoming path back to an app screen.

# TODO: replace with the real Apple Developer Team ID — 10-char alphanumeric,
# e.g. "ABCDE12345". Find it via `eas credentials` (select iOS) or the Apple
# Developer portal's Membership page.
APPLE_TEAM_ID = "REPLACE_WITH_APPLE_TEAM_ID"

# TODO: replace with the SHA-256 fingerprint of the Android release signing
# certificate, format "AA:BB:CC:...". Find it via `eas credentials` (select
# Android > Keystore) or `keytool -list -v -keystore your.keystore`.
ANDROID_SHA256_FINGERPRINT = "REPLACE_WITH_SHA256_FINGERPRINT"

_ALLOWED_PATHS = ["/event/*", "/profile/*", "/chat/*", "/wallet", "/notifications"]


@router.get("/.well-known/apple-app-site-association")
def apple_app_site_association():
    return JSONResponse({
        "applinks": {
            "apps": [],
            "details": [
                {
                    "appID": f"{APPLE_TEAM_ID}.{BUNDLE_ID}",
                    "paths": _ALLOWED_PATHS,
                }
            ],
        }
    })


@router.get("/.well-known/assetlinks.json")
def android_asset_links():
    return JSONResponse([
        {
            "relation": ["delegate_permission/common.handle_all_urls"],
            "target": {
                "namespace": "android_app",
                "package_name": ANDROID_PACKAGE,
                "sha256_cert_fingerprints": [ANDROID_SHA256_FINGERPRINT],
            },
        }
    ])
