import { useCallback } from 'react'
import type { RefObject } from 'react'
import type { View } from 'react-native'
import { captureRef } from 'react-native-view-shot'
import RNShare, { Social } from 'react-native-share'

type ShareImageOptions = {
  message?: string
  title?: string
  failOnCancel?: boolean
}

type ShareImageResult =
  | { shared: true }
  | { shared: false; error: 'not_ready' | 'cancelled' | 'failed'; raw?: unknown }

// Captures the given view as a PNG and opens the native share sheet with it.
// The captured view must render with `collapsable={false}` on Android, or
// the native renderer strips it from the view hierarchy and the snapshot
// comes back blank/black.
export function useImageShare() {
  const shareImage = useCallback(async (
    viewRef: RefObject<View | null>,
    options: ShareImageOptions = {}
  ): Promise<ShareImageResult> => {
    if (!viewRef.current) return { shared: false, error: 'not_ready' }
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      })
      await RNShare.open({
        url: uri,
        message: options.message,
        title: options.title,
        type: 'image/png',
        failOnCancel: options.failOnCancel ?? false,
      })
      return { shared: true }
    } catch (err: any) {
      const cancelled = typeof err?.message === 'string' && err.message.toLowerCase().includes('cancel')
      return { shared: false, error: cancelled ? 'cancelled' : 'failed', raw: err }
    }
  }, [])

  // Opens straight to one social target (e.g. SMS) instead of the full share
  // sheet — used for quick-action buttons. Falls back to the full share sheet
  // if the target app isn't installed/available on this device.
  const shareImageTo = useCallback(async (
    viewRef: RefObject<View | null>,
    social: Exclude<Social, Social.FacebookStories | Social.InstagramStories>,
    options: ShareImageOptions = {}
  ): Promise<ShareImageResult> => {
    if (!viewRef.current) return { shared: false, error: 'not_ready' }
    try {
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      })
      try {
        await RNShare.shareSingle({
          social,
          url: uri,
          message: options.message,
          title: options.title,
        })
        return { shared: true }
      } catch (singleErr: any) {
        const cancelled = typeof singleErr?.message === 'string' && singleErr.message.toLowerCase().includes('cancel')
        if (cancelled) return { shared: false, error: 'cancelled' }
        // Target app unavailable — fall back to the full share sheet
        await RNShare.open({
          url: uri,
          message: options.message,
          title: options.title,
          type: 'image/png',
          failOnCancel: options.failOnCancel ?? false,
        })
        return { shared: true }
      }
    } catch (err: any) {
      const cancelled = typeof err?.message === 'string' && err.message.toLowerCase().includes('cancel')
      return { shared: false, error: cancelled ? 'cancelled' : 'failed', raw: err }
    }
  }, [])

  return { shareImage, shareImageTo }
}
