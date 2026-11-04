import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Eye,
  EyeOff,
  LayoutDashboard,
  KeyRound,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../features/auth/useAdminAuth.js'
import { deleteAdminProfile, logoutAdmin } from '../../features/auth/api/authApi.js'
import { validateProfileDeletion } from '../../features/auth/passwordValidation.js'
import { ApiError } from '../lib/apiClient.js'
import { isExpiredSessionError } from '../lib/authErrors.js'
import Dialog from './Dialog.jsx'
import { useToast } from './useToast.js'

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/change-password', label: 'Change password', icon: KeyRound },
]

const AdminLayoutContent = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeletePasswordVisible, setIsDeletePasswordVisible] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingProfile, setIsDeletingProfile] = useState(false)
  const profileMenuRef = useRef(null)
  const { admin, clearAdmin } = useAdminAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const displayName = admin?.name?.trim() || admin?.email?.split('@')[0] || 'Admin'
  const initials = displayName.slice(0, 1).toUpperCase()

  useEffect(() => {
    if (!isProfileOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setIsProfileOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsProfileOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isProfileOpen])

  const closeDeleteDialog = useCallback(() => {
    if (isDeletingProfile) return
    setIsDeleteDialogOpen(false)
    setDeletePassword('')
    setDeleteError('')
    setIsDeletePasswordVisible(false)
  }, [isDeletingProfile])

  const openDeleteDialog = () => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
    setIsLogoutDialogOpen(false)
    setDeletePassword('')
    setDeleteError('')
    setIsDeletePasswordVisible(false)
    setIsDeleteDialogOpen(true)
  }

  const openLogoutDialog = () => {
    setIsMenuOpen(false)
    setIsProfileOpen(false)
    setIsLogoutDialogOpen(true)
  }

  const handleDeleteProfile = async (event) => {
    event.preventDefault()
    if (isDeletingProfile) return

    const validationMessage = validateProfileDeletion({ currentPassword: deletePassword })
    if (validationMessage) {
      setDeleteError(validationMessage)
      return
    }

    setDeleteError('')
    setIsDeletingProfile(true)
    try {
      await deleteAdminProfile(deletePassword)
      setIsDeleteDialogOpen(false)
      setDeletePassword('')
      setDeleteError('')
      setIsDeletePasswordVisible(false)
      clearAdmin()
      showToast('Admin profile deleted.')
      navigate('/login', { replace: true })
    } catch (error) {
      if (isExpiredSessionError(error, [
        'Current password is incorrect or admin profile cannot be deleted.',
      ])) {
        clearAdmin()
        navigate('/login', { replace: true })
        return
      }
      setDeleteError(error.message || 'Could not delete the admin profile. Please try again.')
    } finally {
      setIsDeletingProfile(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logoutAdmin()
      clearAdmin()
      showToast('You have been signed out.')
      navigate('/login', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAdmin()
        showToast('Your session has ended. Please sign in again.', 'error')
        navigate('/login', { replace: true })
        return
      }
      showToast(error.message || 'Could not sign out. Please try again.', 'error')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none lg:static lg:translate-x-0 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isSidebarCollapsed ? 'lg:w-20 lg:px-3' : 'lg:w-72 lg:px-5'
      }`}>
        <div className={`flex min-h-12 items-center justify-between gap-2 ${isSidebarCollapsed ? 'lg:flex-col lg:justify-center' : ''}`}>
          <div className={`flex min-w-0 items-center gap-3 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white"
              title={displayName}
              role="img"
              aria-label={`${displayName} admin profile`}
            >
              {initials}
            </span>
            <span className={`min-w-0 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
              <span className="block truncate text-sm font-semibold text-slate-900">{displayName}</span>
              <span className="block truncate text-xs text-slate-500">{admin?.email}</span>
            </span>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMenuOpen(false)}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          >
            <X size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isSidebarCollapsed}
            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:flex ${isSidebarCollapsed ? 'lg:mt-3' : ''}`}
          >
            {isSidebarCollapsed
              ? <PanelLeftOpen size={19} aria-hidden="true" />
              : <PanelLeftClose size={19} aria-hidden="true" />}
          </button>
        </div>

        <nav aria-label="Admin navigation" className="mt-5 space-y-2 border-t border-slate-200 pt-5">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsMenuOpen(false)}
              title={isSidebarCollapsed ? label : undefined}
              className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 ${
                isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
              } ${
                isActive
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={`mt-auto space-y-1 border-t border-slate-200 pt-4 ${isSidebarCollapsed ? 'lg:px-0' : ''}`}>
          <button
            type="button"
            onClick={openLogoutDialog}
            disabled={isLoggingOut}
            title={isSidebarCollapsed ? 'Sign out' : undefined}
            aria-label="Sign out"
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100 disabled:opacity-60 ${
              isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut size={18} aria-hidden="true" />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Sign out</span>
          </button>
          <button
            type="button"
            onClick={openDeleteDialog}
            title={isSidebarCollapsed ? 'Delete profile' : undefined}
            aria-label="Delete profile"
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-700 transition-colors duration-200 hover:bg-red-50 hover:text-red-800 ${
              isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Trash2 size={18} aria-hidden="true" />
            <span className={isSidebarCollapsed ? 'lg:hidden' : ''}>Delete profile</span>
          </button>
        </div>
      </aside>

      {isLogoutDialogOpen && (
        <Dialog
          labelledBy="confirm-signout-title"
          onClose={() => {
            if (!isLoggingOut) setIsLogoutDialogOpen(false)
          }}
          className="max-w-sm p-6"
        >
            <h2 id="confirm-signout-title" className="text-lg font-semibold text-slate-950">
              Sign out?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              You’ll need to sign in again to access the admin dashboard.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutDialogOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
        </Dialog>
      )}

      {isDeleteDialogOpen && (
        <Dialog
          labelledBy="delete-profile-title"
          onClose={closeDeleteDialog}
          className="max-w-md p-6"
        >
            <h2 id="delete-profile-title" className="text-lg font-semibold text-slate-950">
              Delete admin profile?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This permanently deletes your admin account. Enter your current password to confirm.
            </p>
            <form onSubmit={handleDeleteProfile} noValidate className="mt-5 space-y-4">
              <div>
                <label htmlFor="delete-profile-password" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Current password
                </label>
                <div className="relative">
                  <input
                    id="delete-profile-password"
                    type={isDeletePasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoFocus
                    required
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    aria-invalid={Boolean(deleteError)}
                    aria-describedby={deleteError ? 'delete-profile-error' : undefined}
                    className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                  <button
                    type="button"
                    onClick={() => setIsDeletePasswordVisible((visible) => !visible)}
                    aria-label={isDeletePasswordVisible ? 'Hide current password' : 'Show current password'}
                    aria-pressed={isDeletePasswordVisible}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-950"
                  >
                    {isDeletePasswordVisible
                      ? <EyeOff size={18} aria-hidden="true" />
                      : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {deleteError && (
                <p id="delete-profile-error" role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
                  {deleteError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={isDeletingProfile}
                  onClick={closeDeleteDialog}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingProfile}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingProfile ? 'Deleting…' : 'Delete profile'}
                </button>
              </div>
            </form>
        </Dialog>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            >
              {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <Link to="/" className="flex items-center gap-3" aria-label="Keynest Admin overview">
              <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <span className="text-sm font-bold">K</span>
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-950">Keynest</span>
                <span className="block text-xs text-slate-500">Admin console</span>
              </span>
            </Link>
          </div>
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-expanded={isProfileOpen}
              aria-controls="admin-profile-menu"
              aria-label={`Admin profile: ${displayName}`}
              className="inline-flex min-h-10 max-w-52 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 text-sm font-medium text-slate-800 hover:bg-slate-50 sm:pr-3"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden max-w-32 truncate sm:block">{displayName}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
            {isProfileOpen && (
              <div id="admin-profile-menu" className="absolute right-0 top-full z-30 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{admin?.email}</p>
                </div>
                <Link
                  to="/change-password"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <KeyRound size={16} aria-hidden="true" />
                  Change password
                </Link>
                <button
                  type="button"
                  onClick={openDeleteDialog}
                  className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Delete profile
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={openLogoutDialog}
                  disabled={isLoggingOut}
                  className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  <LogOut size={16} aria-hidden="true" />
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-7 sm:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayoutContent
