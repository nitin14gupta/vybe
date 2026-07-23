import { useToastStore } from '@/store/toastStore'

export function useToast() {
  const show = useToastStore((s) => s.show)
  return {
    show,
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
  }
}
