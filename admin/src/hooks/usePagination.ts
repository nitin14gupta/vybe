import { useCallback, useState } from 'react'

export function usePagination(initialSize = 25) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialSize)

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPage(1)
  }, [])

  return { page, pageSize, setPage, setPageSize }
}
