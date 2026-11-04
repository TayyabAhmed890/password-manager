export const isAdminAccount = (user) =>
  user?.role === 'admin' &&
  typeof user.id === 'string' &&
  user.id.length > 0 &&
  typeof user.email === 'string' &&
  user.email.length > 0
