export const getDisplayName = (user) => {
  const savedName = user?.name?.trim()
  if (savedName) {
    return savedName
  }

  const emailName = user?.email?.split('@')[0]
  if (!emailName) {
    return 'Account'
  }

  return emailName.replace(/[._+-]+/g, ' ').trim() || 'Account'
}
