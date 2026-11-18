export const getDisplayName = (user) => {
  const savedName = user?.name?.trim()
  if (savedName) {
    return savedName
  }

  const email = user?.email
  if (!email) {
    return 'Account'
  }

  const atIndex = email.indexOf('@')
  const emailName = atIndex === -1 ? email : email.slice(0, atIndex)
  if (!emailName) {
    return 'Account'
  }

  return emailName.replace(/[._+-]+/g, ' ').trim() || 'Account'
}
