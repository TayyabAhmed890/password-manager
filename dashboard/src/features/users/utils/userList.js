export const filterUsersOnPage = (users, query) => {
  const safeUsers = Array.isArray(users) ? users : []
  const normalizedQuery = typeof query === 'string' ? query.trim().toLowerCase() : ''
  if (!normalizedQuery) return safeUsers

  return safeUsers.filter((user) =>
    typeof user?.email === 'string' && user.email.toLowerCase().includes(normalizedQuery)
  )
}

export const getPaginationState = ({ page, totalPages }) => {
  const safePage = Number.isFinite(page) ? Math.floor(page) : 1
  const safeTotalPages = Number.isFinite(totalPages) ? Math.max(0, Math.floor(totalPages)) : 0
  const currentPage = Math.max(1, Math.min(safePage, Math.max(safeTotalPages, 1)))
  return {
    currentPage,
    canGoPrevious: currentPage > 1,
    canGoNext: currentPage < safeTotalPages,
  }
}

export const formatAccountDate = (dateValue) => {
  if (dateValue === null || dateValue === undefined || dateValue === '') return 'Date unavailable'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
